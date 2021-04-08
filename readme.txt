PackageMerge will allow you to easily combine multiple package.xml files into one suitable for using as your project manifest for your Salesforce project.

NOTE: Node.js is required! Get it here https://nodejs.org/en/download/

Then simply put your xml files in the packages folder and run the 'runme.bat' (or open a command prompt in this folder and type node process.js). If everything goes well you'll get a brand new package.xml in the root folder.

NOTE: You can include folders within the packages folder. packageMerge will find any XML files in that package no matter how they are organized.

The process.js file has two variables you may want to look at. 
forcePackageVersion - Forces the package.xml file to have a specific version. Great for when your merging lots of packages from different versions and want to use a specific one.
updateMasterBranchWithMergeData - Controls if the merged package data is also written into the package.xml file in the MasterBranch folder. Good for if you are continually appending to your master package.

Report any errors or upgrade ideas to Kenji776@gmail.com

