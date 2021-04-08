const fs = require('fs');
var path = require('path')
var xml2js = require('xml2js');
var parseString = xml2js.parseString;
var packageStructure = '<?xml version="1.0" encoding="UTF-8"?><Package xmlns="http://soap.sforce.com/2006/04/metadata"><version>48.0</version></Package>';
var fileDataArray = [];
var forcePackageVersion = 48; //set this if you want a specific package version.
var updateMasterBranchWithMergeData = true;
var fileNamesArray = [];
function init()
{
	log('Package Merge 1.0!. It\'s the mergiest!',true,'green');

	var d = new Date();
	d.toLocaleString();  
	
	log('Started process at ' + d, false);
	
	//create our basic package XML template to add into.
	var mergedContent = createPackageXmlTemplate();
	readXmlFilesFromDir('packages','.xml');
	
	console.log('Finished reading files. Starting merge');
	var mergedData = mergeFileData(fileDataArray,mergedContent);
	mergedData = sortValues(mergedData);	
	writeXML(mergedData, 'package.xml');

	log('All done. Enjoy your shiney new package.xml file!',true,'green');
	log('Process completed',false);
	log('\r\n\r\n------------------------------------------------ ', false);
}

function readXmlFilesFromDir(startPath,filter){

    if (!fs.existsSync(startPath))
	{
        log("no dir ",startPath);
        return;
    }

    var files=fs.readdirSync(startPath);
	
    for(var i=0;i<files.length;i++)
	{
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory())
		{
            readXmlFilesFromDir(filename,filter); //recurse
        }
        else if (filename.indexOf(filter)>=0) 
		{
            log('found package file: ' + filename);
			
			var content = fs.readFileSync(filename).toString();
			fileNamesArray.push(filename);
			
			parseString(content, function (err, result) 
			{
				if(err)
				{
					log('Error parsing XML! ' + JSON.stringify(err,null,2),true,'red');
				}
				fileDataArray.push(result);
			})			
        };
    };
};

function fixXML(unescaped)
{
	//const re1 = new RegExp('<members>(.*?)</members>'/g)
	
	console.log('Fixing XML/Replacing special characters');
	var match;
	log('Before',true,'green')
	console.log(unescaped);
	
	unescaped.match(/\<members\>(.*?)\<\/members\>/g).forEach((element) => {
	   // Do something with each element
	   element = translateHTMLEntities(element);
	});

	log('After',true,'green')
	console.log(unescaped);
	
	return unescaped;
	
}

function translateHTMLEntities(unescaped)
{
	/*
	log('Before',true,'green');
	console.log(unescaped);
	unescaped = unescaped.replace(/%28/g, "")
	.replace(/%29/g, "")
	.replace(/%2E/g, "")
	.replace(/%26/g, "");
	
	log('After',true,'green')
	console.log(unescaped);
	*/
	return unescaped;
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function createPackageXmlTemplate()
{
	//create our basic package XML template to add into.
	var newPackage;
	parseString(packageStructure, function (err, result) 
	{
		newPackage = result;
		newPackage.Package.types = [];
	});
	
	return newPackage;
}

function writeXML(objectData, filename)
{

	objectData.Package.types = objectData.Package.types.sort((a, b) => (a.name > b.name) ? 1 : -1);
	if(forcePackageVersion != null)
	{
		objectData.Package.version = forcePackageVersion;
	}	
	log('Writing new package.xml...');
	log(JSON.stringify(objectData, undefined, 2));
	
	var builder = new xml2js.Builder();
	var xml = builder.buildObject(objectData);

	fs.writeFileSync(filename, xml, function(err)
	{
		if(err) 
		{
			return log(err);
		}
		log("The file was saved!");
	}); 	

	if(updateMasterBranchWithMergeData)
	{
		fs.writeFileSync('packages\\MasterBranch\\'+filename, xml, function(err)
		{
			if(err) 
			{
				return log(err);
			}
			log("The file was saved!");
		});	
	}
}

function mergeFileData(filesArray,packageObject)
{	
	filesArray.forEach(function (thisFile, index){
		
		if(thisFile && thisFile.hasOwnProperty('Package') && thisFile.Package.hasOwnProperty('types'))
		{
			log('Reading from package file ' +  fileNamesArray[index],true,'green');
			thisFile.Package.types.forEach(function (thisType, index2)
			{
				log('Writing ' + thisType.members.length + ' members to ' + thisType.name);
				packageObject = appendTypesToPackage(String(thisType.name),thisType.members,packageObject);
				
			});
		}
		else
		{
			log('Malfomred or empty packaged file: ' + fileNamesArray[index],true,'red');
		}
	});
	
	return packageObject;
}

function getUnique(array){
	var uniqueArray = [];
	
	// Loop through array values
	for(i=0; i < array.length; i++){
		if(uniqueArray.indexOf(array[i]) === -1) {
			uniqueArray.push(array[i]);
		}
	}
	return uniqueArray;
}
	
function appendTypesToPackage(typeName, members, packageObject)
{

	if(!packageObject.Package.hasOwnProperty('types'))
	{
		packageObject.Package.types = [];
	}
	var matchFound = false;
	
	packageObject.Package.types.forEach(function (thisType, index2)
	{
		var thisTypeName = String(thisType.name);

		if(thisTypeName == typeName)
		{
			thisType.members=getUnique(thisType.members.concat(members));
			matchFound = true;
			return packageObject;
		}
	});
	
	if(!matchFound)
	{
		var dataObject = {'name':typeName,'members':getUnique(members)};
		packageObject.Package.types.push(dataObject);
	}

	return packageObject;	
}

function sortValues(packageObject)
{

	packageObject.Package.types.forEach(function (thisType, index2)
	{
		thisType.members.sort();
	});
	
	return packageObject;
}

function log(logItem,printToScreen,color)
{
	printToScreen = printToScreen != null ? printToScreen : true;
	var colorCode='';
	switch(color) {
		case 'red':
			colorCode='\x1b[31m'
		break;
		case 'green':
			colorCode='\x1b[32m';
		break;
		case 'yellow':
			colorCode='\x1b[33m';
	}
	
	if(printToScreen) console.log(colorCode+''+logItem+'\x1b[0m');
	
	fs.appendFile('log.txt', logItem + '\r\n', function (err) {
		if (err) throw err;
	});	
	
	
}
process.on('uncaughtException', (err) => {
    log(err,true,'red');
    process.exit(1) //mandatory (as per the Node docs)
})

init();

