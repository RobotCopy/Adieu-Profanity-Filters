// Open options page if extension icon is clicked
chrome.browserAction.setBadgeBackgroundColor({color: "#446644"});
chrome.browserAction.onClicked.addListener(function() {chrome.runtime.openOptionsPage();});

// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
	chrome.contextMenus.create({
		title: 'Add Word + Variations: [ %s ]',
		id: 'APF0001',
		contexts: ['selection'],
	});
	chrome.contextMenus.create({
		title: 'Add Infix: [ %s ]',
		id: 'APF0002',
		contexts: ['selection'],
	});
	chrome.contextMenus.create({
		title: 'Add Word To Infix Exceptions', //Is it really a word
		id: 'APF0003',
		contexts: ['page'],
	});
	
	if (details.reason == "install"){
		chrome.runtime.openOptionsPage();
	}else if(details.reason == "update") {
		var thisVersion = chrome.runtime.getManifest().version;
		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
	}
});

// Show badge with number of words filtered
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		chrome.browserAction.setBadgeText({text: request.counter, tabId: sender.tab.id});

		if(request.color && request.color!="none"){
			chrome.browserAction.setIcon({
				path:{
				16:"icons/icon16_"+request.color+".png",
				48:"icons/icon48_"+request.color+".png"
				},
				tabId: sender.tab.id
			});
		}
	}
);

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
	if(details.url.indexOf("chrome://")>=0){
		chrome.tabs.executeScript(null,{file:"aFilter.js"});
	}
});

/*******************************************************************/
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "APF0001") {
		chrome.tabs.sendMessage(tab.id,{type:"selectedtext"},function(response){
			var stopWord = validateTextArea(response.selectedtext);
			
			for(var i=0;i<stopWord.length;i++){
				if (confirm("Are you sure to add "+stopWord[i]+" as a word") == true){
					if(stopWord[i].length > 0){
						if(storeWord(stopWord[i].toLowerCase(),"complete")){
							console.log('> Word not in list: '+stopWord[i]);
						}else{
							console.log('> Word already in list');
						}
					}
				}
			}
		});
    }else if(info.menuItemId==="APF0002"){
		chrome.tabs.sendMessage(tab.id,{type:"selectedtext"},function(response){
			var stopWord = validateTextArea(response.selectedtext);
			
			for(var i=0;i<stopWord.length;i++){
				if (confirm("Are you sure to add "+stopWord[i]+" as a infix") == true){
					if(stopWord[i].length > 0){
						if(storeWord(stopWord[i].toLowerCase(),"nested")){
							console.log('> Infix not in list');
						}else{
							console.log('> Infix already in list');
						}
					}
				}
				/*if(response.selectedurl.length > 0){
					console.log('testing url: '+response.selectedurl);
					//...
				}*/
			}
		});
	}else if(info.menuItemId==="APF0003"){
		var testWord=prompt("Please enter exception", "");
		testWord=testWord.toLowerCase();

		if(testWord!=null && testWord!=""){
			//console.log("Hi: "+testWord);
			if(storeWord(testWord,"exception")){
				console.log('> Infix not in list');
			}else{
				console.log('> Infix already in list');
			}
		}
	}/*else if(info.menuItemId==="APF0003"){
		chrome.tabs.sendMessage(tab.id,{type:"selectedpage"},function(response){
			//var stopWord = validateTextArea(response.selectedtext);
			
			for(var i=0;i<stopWord.length;i++){
				if (confirm("Are you sure to add; "+stopWord[i]) == true){
					if(stopWord[i].length > 0){
						if(storeWord(stopWord[i].toLowerCase(),false)){
							console.log('> Infix not in list');
						}else{
							console.log('> Infix already in list');
						}
					}
				}
				//if(response.selectedurl.length > 0){
				//	console.log('testing url: '+response.selectedurl);
					//...
				//}
			}
		});
	}*/
});

function validateTextArea(text){
	var text = text.toLowerCase().replace(/\s*[\r\n]+\s*/g, '\n').replace(/^\s+|\s+$/g, '');
	return text.length ? text.split('\n') : [];
};

function storeWord(contextWord,typeOfWord){
	var i,flgRepeated=false;
	var tempList=[];
	var defaults={
		//Complete
		"curseComplete":"[]","humiliatingComplete":"[]","degradingComplete":"","blasphemyComplete":"","sexismComplete":"[]","racismComplete":"[]","homophobiaComplete":"[]","explicitComplete":"[]","immodestyComplete":"[]","nudityComplete":"[]","triumphalismComplete":"[]","elitismComplete":"[]","arroganceComplete":"[]","isolationismComplete":"[]","bullyingComplete":"[]","drugsComplete":"[]",

		//Nested
		"curseNested":"[]","humiliatingNested":"[]","degradingNested":"[]","blasphemyNested":"[]","sexismNested":"[]","racismNested":"[]","homophobiaNested":"[]","explicitNested":"[]","immodestyNested":"[]","nudityNested":"[]","triumphalismNested":"[]","elitismNested":"[]","arroganceNested":"[]","isolationismNested":"[]","bullyingNested":"[]","drugsNested":"[]",
		
		'wordListComplete':'',
		'wordListNested':'',
		'filterExtreme': false, 
		'wordListExceptions': '',
		'hideSentence': true, 
		'preserveFirst': false, 
		'showCounter': true, 
		'consoleOutput': false,
		'checkTextInImage': false,
		'minWordsPerCategory':'2',
		'hideSentenceMark':'#!',
		'profanityString': '0',
		
		'customNested': "[]",
		'customComplete': "[]",
		
		'safeWordsIndex':[0,0,0],
		'profanityList':['']
	};
	
	chrome.storage.sync.get(defaults,function(settings){
		if(typeOfWord=="complete"){
			if(!flgRepeated){
				tempList=settings.triumphalismComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.isolationismComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.elitismComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.nudityComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.curseComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.degradingComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.humiliatingComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.arroganceComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.immodestyComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.blasphemyComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.sexismComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.racismComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.homophobiaComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.drugsComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.explicitComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.bullyingComplete.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.customComplete.split(',');
				for(i=0;i<tempList.length;i++){
					console.log("customComplete: "+tempList[i]);
					if(tempList[i]==contextWord) flgRepeated=true;
				}
			}
		}else if(typeOfWord=="nested"){
			if(!flgRepeated){ 
				tempList=settings.triumphalismNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.isolationismNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.elitismNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.nudityNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.curseNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.degradingNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.humiliatingNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.arroganceNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.immodestyNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.blasphemyNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.sexismNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.racismNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.homophobiaNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.drugsNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.explicitNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.bullyingNested.split(',');
				for(i=0;i<tempList.length;i++)
					if(tempList[i]==contextWord) flgRepeated=true;
			}
			if(!flgRepeated){
				tempList=settings.customNested.split(',');
				for(i=0;i<tempList.length;i++){
					//console.log("customNested: "+tempList[i]);
					if(tempList[i]==contextWord) flgRepeated=true;
				}
			}
		}else if(typeOfWord=="exception"){
			if(!flgRepeated){
				tempList=settings.wordListExceptions.split(',');
				for(i=0;i<tempList.length;i++){
					//console.log("customNested: "+tempList[i]);
					if(tempList[i]==contextWord) flgRepeated=true;
				}
			}
		}
		
		/*********************************************************************/
		if(!flgRepeated){
			if(typeOfWord=="complete"){
				settings.customComplete=settings.customComplete+","+contextWord;
				settings.safeWordsIndex.push(17);
				settings.profanityList.push('\\b('+contextWord[0]+')'+contextWord.substring(1)+'\\b');
				
				chrome.storage.sync.set(settings,function(){
					if(chrome.runtime.lastError){
						alert("The word [ "+contextWord+" ] was added, Please try again.");
						console.log('Word not saved! Please try again. ('+chrome.runtime.lastError.message+')');
					}else{
						alert("The word [ "+contextWord+" ] was added.");
						console.log('Word saved successfully!');
					}
				});
			}else if(typeOfWord=="nested"){
				settings.customNested=settings.customNested+","+contextWord;
				settings.safeWordsIndex.push(17);
				settings.profanityList.push('\\b(\\w?)\\w*('+contextWord[0]+')'+contextWord.substring(1)+"\\w*\\b");
				
				chrome.storage.sync.set(settings,function(){
					if(chrome.runtime.lastError){
						alert("The infix [ "+contextWord+" ] was not added, Please try again.");
						console.log('Infix not saved! Please try again. ('+chrome.runtime.lastError.message+')');
					}else{
						alert("The infix [ "+contextWord+" ] was added.");
						console.log('Infix saved successfully!');
					}
				});
			}else if(typeOfWord=="exception"){
				settings.wordListExceptions=settings.wordListExceptions+","+contextWord;
				settings.exceptionList.push(caesarShift2(contextWord));//Agregar caesarShift2
				
				chrome.storage.sync.set(settings,function(){
					if(chrome.runtime.lastError){
						alert("The infix [ "+contextWord+" ] was not added, Please try again.");
						console.log('Infix not saved! Please try again. ('+chrome.runtime.lastError.message+')');
					}else{
						alert("The infix [ "+contextWord+" ] was added.");
						console.log('Infix saved successfully!');
					}
				});
			}
		}else{
			if(typeOfWord=="complete"){
				alert("The word [ "+contextWord+" ] is already in list");
				console.log("Word is repeated");
			}else if(typeOfWord=="nested"){
				alert("The infix [ "+contextWord+" ] is already in list");
				console.log("Infix is repeated");
			}else if(typeOfWord=="exception"){
				alert("The exception [ "+contextWord+" ] is already in list");
				console.log("Exception is repeated");
			}
		}	
		/*********************************************************************/
	});
	
	chrome.tabs.query({active:true,currentWindow:true},function(tabs){
		//chrome.tabs.sendMessage(tabs[0].id,{type: 'update'});
		chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
		//chrome.tabs.reload(tabs[0].id);
	});
	
	if(!flgRepeated) return true;
	else return false;
}

function caesarShift2(str){
	var amount  = 13;
	var output = '';
	for (var i = 0; i < str.length; i ++) {
		var c = str[i];
		if (c.match(/[a-z]/i)) {
			var code = str.charCodeAt(i);
			if((code>=65)&&(code<=90)){
				c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
			}else if((code>=97)&&(code<=122)){
				c = String.fromCharCode(((code - 97 + amount) % 26) + 97);
			}
		}
		output += c;
	}
	return output;
}
