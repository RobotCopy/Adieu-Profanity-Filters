// It is Needed to add defaults
// Delete the option preserve first character
var profanityCategories=[
	[ //Yellow rating: Nested,Complete
		["triumphalism",10],
		["isolationism",13],
		["elitism",11],
		["nudity",9],
		["curse",0]
	],
	[ //Orange rating: Nested,Complete
		["degrading",2],
		["humiliating",1],
		["arrogance",12],//mentalism
		["immodesty",8]//sexual //offensive sexual
	],
	[ //Red rating: Nested,Complete
		["blasphemy",3],//profanity
		["sexism",4],
		["racism",5],
		["homophobia",6],
		["drugs",15],
		["explicit",7],
		["bullying",14]
	],
	[ // Green rating: custom words, complete
		["custom",17]
	]
	// Youtube is category 16
];

function generateExceptionList(){
	var x, isExtreme, exceptionList=[],wordListNested=[],wordListEx=[];
	isExtreme = document.getElementById('filterExtreme').checked;
	wordListEx = getByIdSplit('wordListExceptions');
	
	if(isExtreme){
		wordListEx=MakeExtreme(wordListEx);
	}
	
	for (x = 0; x < wordListEx.length; x++){
		exceptionList.push(caesarShift2(wordListEx[x]));
	}

	
	/*if(wordListExceptions.length>0){
		for (x = 0; x < (wordListExceptions.length); x++){
			exceptionList+=(wordListExceptions[x]+",");
		}
	}*/
	
	return exceptionList;
}

function generateProfanityList(){
	var x, i, isExtreme, profanityList=[], wordListComplete=[], wordListNested=[];
	isExtreme = document.getElementById('filterExtreme').checked;
	//wordListComplete = document.getElementById('wordListComplete').value.split(',');
	//wordListNested = document.getElementById('wordListNested').value.split(',');
	//var wlc=wordListComplete.length;
	//var wn=wordListNested.length;
	
	if(isExtreme){
		
		for(i=0;i<profanityCategories.length;i++){
			for(x=0;x<profanityCategories[i].length;x++){
				wordListComplete=getByIdSplit(profanityCategories[i][x][0]+"Complete");
				
				wordListComplete=MakeExtreme(wordListComplete);
				for(y=0;y<wordListComplete.length;y++){
					profanityList.push('\\b('+wordListComplete[y][0]+')'+wordListComplete[y].substring(1) + '\\b');
				}
			}
		}
	
		for(i=0;i<profanityCategories.length;i++){
			for(x=0;x<profanityCategories[i].length;x++){
				wordListNested=getByIdSplit(profanityCategories[i][x][0]+"Nested");

				wordListNested=MakeExtreme(wordListNested);
				for(y=0;y<wordListNested.length;y++){
					profanityList.push('\\b(\\w?)\\w*('+wordListNested[y][0]+')'+wordListNested[y].substring(1)+"\\w*\\b");
				}
			}
		}
		
		//findSafeWord: Special category
		profanityList.push("\\b(\\w?)\\w*([\\#\\$\\&\\%\\-])[\\#\\$\\&\\%\\-][\\#\\$\\&\\%\\-]+\\w*\\b");
	}else{
		for(i=0;i<profanityCategories.length;i++){
			for(x=0;x<profanityCategories[i].length;x++){
				wordListComplete=getByIdSplit(profanityCategories[i][x][0]+"Complete");
				for(y=0;y<wordListComplete.length;y++){
					profanityList.push('\\b(' + wordListComplete[y][0] + ')' + wordListComplete[y].substring(1) + '\\b'); 
				}
			}
		}
		
		for(i=0;i<profanityCategories.length;i++){
			for(x=0;x<profanityCategories[i].length;x++){
				wordListNested=getByIdSplit(profanityCategories[i][x][0]+"Nested");
				for(y=0;y<wordListNested.length;y++){
					profanityList.push('\\b(\\w?)\\w*(' + wordListNested[y][0] + ')' + wordListNested[y].substring(1)+"\\w*\\b");
				}
			}
		}
	}
	
	return profanityList;
}

function getByIdSplit(idToSplit){
	var tempList=document.getElementById(idToSplit).value.split(',');
	if(tempList.length==1 && tempList[0]==""){
		return[];
	}
	return tempList;
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

function MakeExtreme(wordList){
	var flgFirst;
	for (var x = 0; x < wordList.length; x++){
		flgFirst=true;
		tmpString="\(";
		for (y = 0; y < wordList[x].length; y++){
			switch(wordList[x][y]) {
				case "a":
					tmpString+="[a46\\@]+";
					break;
				case "e":
					tmpString+="[e3]+";
					break;
				case "i":
					tmpString+="[i1\\!]+";
					break;
				case "o":
					tmpString+="[o0]+";
					break;
				case "u":
					tmpString+="[u4]+";
					break;
				case "s":
					tmpString+="[sz5\\$]+";
					break;
				case "r":
					tmpString+="[r\+]";
					break;
				case "t":
					tmpString+="[t7]";
					break;
				case "c":
				case "k":
					tmpString+="[ck\\%]";
					break;
				/*case "g":
				case "j":
					tmpString+="[gj]";
					break;*/
				case "h":
					tmpString+="[h\\#]";
					break;
				default:
					tmpString+=wordList[x][y];
					break;
			}
			if(flgFirst){
				tmpString+="\)";
				flgFirst=false;
			}
			//tmpString+="[\\S\\W]*";
		}
		wordList[x]=tmpString;
	}
	return wordList;
}

function findSafeReplacement(index){
	//15 categories - EXPERIMENTAL
	switch(index) {
		case "3"://safeWords
			return ["[curse]","[freak]","[poop]","[darn]","[lady]","[brother]","[homosexual]","[fluids]","[naughty]","[body part]","[clouds]","[bum]","[dummy]","[lonely]","[warning]","[substances]","[YT]","[profanity]"];
			break;
		case "4"://safetvwords
			return ["[frell]","[smeg]","[shazbot]","[gorram]","[female dog]","[blurgh]","[homosexual]","[frell]","[fist bump]","[toaster]","[cloff-prunker]","[jagweed]","[gimboid]","[snooty pooty]","[yo-yo ma]","[kook]","[YT]","[profanity]"];
			break;
		case "5"://safefunny
			return ["[oopsie]","[cuku bananas]","[dookie]","[for pete\'s sake]","[witch]","[mother trucker]","[nancy]","[crabapples]","[my grits]","[nuts]","[gadzooks]","[bozos]","[son of a biscuit]","[frumper]","[loblolly]","[drunkle]","[YT]","[profanity]"];
			break;
		case "6"://safecheck
			return ["[intolerance]","[discriminatory]","[threat]","[intolerance]","[discriminatory]","[discriminatory]","[discriminatory]","[sexist]","[sexist]","[nudity]","[discriminatory]","[discriminatory]","[discriminatory]","[antisocial]","[violence]","[substances]","[YT]","[profanity]"];
			break;
		case "7"://klingon
			return ["[qovpatlh]","[ha'dibah]","['iqnah qad]","[hu'tegh]","[hab sosli' quch]","['urwi']","[homosexual]","['iqnah]","[nga'chuq]","[sa'hut]","[clouds]","[p'tok]","[qoh]","[mobwi']","[bihnuch]","[pujwi']","[YT]","[profanity]"];
			break;
		case "8"://safecheckdetail
			return ["[curse]","[humiliating]","[degrading]","[blasphemy]","[sexism]","[racism]","[homophobia]","[explicit]","[immodesty]","[nudity]","[triumphalism]","[elitism]","[arrogance]","[isolationism]","[bullying]","[drugs]","[YT]","[profanity]"];
			break;
		default:
			return ["[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[fool]","[YT]","[profanity]"];
	}
}

function findSafeWord(){
	var wordListComplete=[], wordListNested=[], listIndex=[];
	isExtreme = document.getElementById('filterExtreme').checked;
	//wordListComplete = document.getElementById('wordListComplete').value.split(',');
	//wordListNested = document.getElementById('wordListNested').value.split(',');
	//var wlc=wordListComplete.length,wln=wordListNested.length;

	for(i=0;i<profanityCategories.length;i++){
		for(x=0;x<profanityCategories[i].length;x++){
			lengthList=getByIdSplit(profanityCategories[i][x][0]+"Complete").length;
			categoryList=profanityCategories[i][x][1];
			
			for(y=0;y<lengthList;y++){
				listIndex.push(categoryList);
			}
		}
	}
	
	for(i=0;i<profanityCategories.length;i++){
		for(x=0;x<profanityCategories[i].length;x++){
			lengthList=getByIdSplit(profanityCategories[i][x][0]+"Nested").length;
			categoryList=profanityCategories[i][x][1];
			
			for(y=0;y<lengthList;y++){
				listIndex.push(categoryList);
			}
		}
	}
	
	// from generateProfanityList
	if(isExtreme){
		listIndex.push(0);//Additional in extreme
		listIndex.push(0);//Additional in extreme
	}
	
	return listIndex;
}

/*******************************************************************************/
function update_status(message, error, timeout) {
  var status = document.getElementById('status');
  if (error) {status.className = 'error';}
  status.textContent = message;
  setTimeout(function() {status.textContent = ''; status.className = '';}, timeout);
}

// Saves options to sync storage
function save_options(){
  // Gather current settings
  var settings = {};
  
	settings.triumphalismNested = document.getElementById("triumphalismNested").value;
	settings.triumphalismComplete = document.getElementById("triumphalismComplete").value;
	settings.isolationismNested = document.getElementById("isolationismNested").value;
	settings.isolationismComplete = document.getElementById("isolationismComplete").value;
	settings.elitismNested = document.getElementById("elitismNested").value;
	settings.elitismComplete = document.getElementById("elitismComplete").value;
	settings.nudityNested = document.getElementById("nudityNested").value;
	settings.nudityComplete = document.getElementById("nudityComplete").value;
	settings.curseNested = document.getElementById("curseNested").value;
	settings.curseComplete = document.getElementById("curseComplete").value;
	settings.degradingNested = document.getElementById("degradingNested").value;
	settings.degradingComplete = document.getElementById("degradingComplete").value;
	settings.humiliatingNested = document.getElementById("humiliatingNested").value;
	settings.humiliatingComplete = document.getElementById("humiliatingComplete").value;
	settings.arroganceNested = document.getElementById("arroganceNested").value;
	settings.arroganceComplete = document.getElementById("arroganceComplete").value;
	settings.immodestyNested = document.getElementById("immodestyNested").value;
	settings.immodestyComplete = document.getElementById("immodestyComplete").value;
	settings.blasphemyNested = document.getElementById("blasphemyNested").value;
	settings.blasphemyComplete = document.getElementById("blasphemyComplete").value;
	settings.sexismNested = document.getElementById("sexismNested").value;
	settings.sexismComplete = document.getElementById("sexismComplete").value;
	settings.racismNested = document.getElementById("racismNested").value;
	settings.racismComplete = document.getElementById("racismComplete").value;
	settings.homophobiaNested = document.getElementById("homophobiaNested").value;
	settings.homophobiaComplete = document.getElementById("homophobiaComplete").value;
	settings.drugsNested = document.getElementById("drugsNested").value;
	settings.drugsComplete = document.getElementById("drugsComplete").value;
	settings.explicitNested = document.getElementById("explicitNested").value;
	settings.explicitComplete = document.getElementById("explicitComplete").value;
	settings.bullyingNested = document.getElementById("bullyingNested").value;
	settings.bullyingComplete = document.getElementById("bullyingComplete").value;
	
	settings.customComplete = document.getElementById("customComplete").value;
	settings.customNested = document.getElementById("customNested").value;
	
  //settings.wordListComplete = document.getElementById('wordListComplete').value;
  settings.minWordsPerCategory = document.getElementById('minWordsPerCategory').value;
  settings.hideSentenceMark = document.getElementById('hideSentenceMark').value;
  
  settings.preserveFirst = document.getElementById('preserveFirst').checked;
  settings.showCounter = document.getElementById('showCounter').checked;
  settings.consoleOutput = document.getElementById('consoleOutput').checked;
  
  settings.hideSentence = document.getElementById('hideSentence').checked;
  settings.filterExtreme = document.getElementById('filterExtreme').checked;
  
  //Error it is not save, why?
  settings.checkTextInImage = document.getElementById('checkTextInImage').checked;

  //settings.wordListNested = document.getElementById('wordListNested').value;
  settings.wordListExceptions = document.getElementById('wordListExceptions').value;
  
  /*****************************************/
  settings.safeWordsIndex = findSafeWord();
  settings.profanityList = generateProfanityList();
  settings.exceptionList = generateExceptionList();
  /*****************************************/

  var rates = document.getElementsByName('replacer');
  var rate_value;
  for(var i = 0; i < rates.length; i++){
    if(rates[i].checked){
        rate_value = rates[i].value;
		break;
    }
  }
  settings.profanityString = rate_value;
  
  /*****************************************/
  settings.safeReplacement = findSafeReplacement(rate_value);
  /*****************************************/
  
  // Save settings
	chrome.storage.sync.set(settings,function(){
		if (chrome.runtime.lastError){
			update_status('Settings not saved! Please try again. ('+chrome.runtime.lastError.message+')', true, 5000);
		}else{
			update_status('Settings saved successfully!', false, 3000);
			if (document.getElementById('profanityListing').style.display === 'block'){
				toggleProfanity();
			} // Close wordListComplete
		}
	});
}

// Restore default settings
/*function restore_defaults() {
  chrome.storage.sync.clear(function(){
    if (chrome.runtime.lastError) {
      update_status('Error restoring defaults! Please try again.', true, 5000);
    } else {
      restore_options();
      update_status('Default settings restored!', false, 3000);
    }
  });
}*/

// Displays the profanity list and hides the profanity button
function toggleProfanity() {
  var profanityListing = document.getElementById('profanityListing');
  var optionsListing = document.getElementById('options');
  if (profanityListing.style.display === 'none') {
    //document.getElementById('wordListComplete').focus();
    profanityListing.style.display = 'block';
    optionsListing.style.display = 'none';
    document.getElementById('listWarning').style.display = 'none';
    document.getElementById('toggleProfanity').textContent = "Hide Profanity List";
  } else {
    profanityListing.style.display = 'none';
    optionsListing.style.display = 'block';
    document.getElementById('listWarning').style.display = 'block';
    document.getElementById('toggleProfanity').textContent = "Modify Profanity List";
  }
}


// Restores form state to saved values from Chroem Sync
function restore_defaults(){
	var settings = getDefaultsSetting();
	
		// Display saved settings
		document.getElementById("triumphalismNested").value=settings.triumphalismNested;
		document.getElementById("triumphalismComplete").value=settings.triumphalismComplete;
		document.getElementById("isolationismNested").value=settings.isolationismNested;
		document.getElementById("isolationismComplete").value=settings.isolationismComplete;
		document.getElementById("elitismNested").value=settings.elitismNested;
		document.getElementById("elitismComplete").value=settings.elitismComplete;
		document.getElementById("nudityNested").value=settings.nudityNested;
		document.getElementById("nudityComplete").value=settings.nudityComplete;
		document.getElementById("curseNested").value=settings.curseNested;
		document.getElementById("curseComplete").value=settings.curseComplete;
		document.getElementById("degradingNested").value=settings.degradingNested;
		document.getElementById("degradingComplete").value=settings.degradingComplete;
		document.getElementById("humiliatingNested").value=settings.humiliatingNested;
		document.getElementById("humiliatingComplete").value=settings.humiliatingComplete;
		document.getElementById("arroganceNested").value=settings.arroganceNested;
		document.getElementById("arroganceComplete").value=settings.arroganceComplete;
		document.getElementById("immodestyNested").value=settings.immodestyNested;
		document.getElementById("immodestyComplete").value=settings.immodestyComplete;
		document.getElementById("blasphemyNested").value=settings.blasphemyNested;
		document.getElementById("blasphemyComplete").value=settings.blasphemyComplete;
		document.getElementById("sexismNested").value=settings.sexismNested;
		document.getElementById("sexismComplete").value=settings.sexismComplete;
		document.getElementById("racismNested").value=settings.racismNested;
		document.getElementById("racismComplete").value=settings.racismComplete;
		document.getElementById("homophobiaNested").value=settings.homophobiaNested;
		document.getElementById("homophobiaComplete").value=settings.homophobiaComplete;
		document.getElementById("drugsNested").value=settings.drugsNested;
		document.getElementById("drugsComplete").value=settings.drugsComplete;
		document.getElementById("explicitNested").value=settings.explicitNested;
		document.getElementById("explicitComplete").value=settings.explicitComplete;
		document.getElementById("bullyingNested").value=settings.bullyingNested;
		document.getElementById("bullyingComplete").value=settings.bullyingComplete;
		
		document.getElementById("customNested").value=settings.customNested;
		document.getElementById("customComplete").value=settings.customComplete;
		
		//document.getElementById('wordListComplete').value = settings.wordListComplete;
		document.getElementById('minWordsPerCategory').value = settings.minWordsPerCategory;
		document.getElementById('hideSentenceMark').value = settings.hideSentenceMark;
		
		document.getElementById('preserveFirst').checked = settings.preserveFirst;
		document.getElementById('showCounter').checked = settings.showCounter;
		document.getElementById('consoleOutput').checked = settings.consoleOutput;

		document.getElementById('hideSentence').checked = settings.hideSentence;
		document.getElementById('filterExtreme').checked = settings.filterExtreme;
		document.getElementById('checkTextInImage').checked = settings.checkTextInImage;

		//document.getElementById('wordListNested').value = settings.wordListNested;
		document.getElementById('wordListExceptions').value = settings.wordListExceptions;
		
		
		replacers = document.getElementsByName('replacer');
		for (var i = 0, len = replacers.length; i < len; i++)
			replacers[i].checked = false;

		var field = document.getElementById('val' + (parseInt(settings.profanityString)+1));
		if (field) field.checked = true;
		else this.elements.replacers[3].checked = true;
	
  /*****************************************/
  settings.safeWordsIndex = findSafeWord();
  settings.profanityList = generateProfanityList();
  settings.exceptionList = generateExceptionList();
  /*****************************************/

  /*****************************************/
  settings.safeReplacement = findSafeReplacement(settings.profanityString);
  /*****************************************/
  
	chrome.storage.sync.set(settings,function(){
		if (chrome.runtime.lastError){
			update_status('Error restoring defaults! Please try again. ('+chrome.runtime.lastError.message+')', true, 5000);
		}else{
			update_status('Default settings restored!', false, 3000);
			if (document.getElementById('profanityListing').style.display === 'block'){
				toggleProfanity();
			} // Close wordListComplete
		}
	});
	
}

function restore_options() {
	var defaults = getDefaultsSetting();
	
	chrome.storage.sync.get(defaults, function(settings) {
		// Display saved settings
		document.getElementById("triumphalismNested").value=settings.triumphalismNested;
		document.getElementById("triumphalismComplete").value=settings.triumphalismComplete;
		document.getElementById("isolationismNested").value=settings.isolationismNested;
		document.getElementById("isolationismComplete").value=settings.isolationismComplete;
		document.getElementById("elitismNested").value=settings.elitismNested;
		document.getElementById("elitismComplete").value=settings.elitismComplete;
		document.getElementById("nudityNested").value=settings.nudityNested;
		document.getElementById("nudityComplete").value=settings.nudityComplete;
		document.getElementById("curseNested").value=settings.curseNested;
		document.getElementById("curseComplete").value=settings.curseComplete;
		document.getElementById("degradingNested").value=settings.degradingNested;
		document.getElementById("degradingComplete").value=settings.degradingComplete;
		document.getElementById("humiliatingNested").value=settings.humiliatingNested;
		document.getElementById("humiliatingComplete").value=settings.humiliatingComplete;
		document.getElementById("arroganceNested").value=settings.arroganceNested;
		document.getElementById("arroganceComplete").value=settings.arroganceComplete;
		document.getElementById("immodestyNested").value=settings.immodestyNested;
		document.getElementById("immodestyComplete").value=settings.immodestyComplete;
		document.getElementById("blasphemyNested").value=settings.blasphemyNested;
		document.getElementById("blasphemyComplete").value=settings.blasphemyComplete;
		document.getElementById("sexismNested").value=settings.sexismNested;
		document.getElementById("sexismComplete").value=settings.sexismComplete;
		document.getElementById("racismNested").value=settings.racismNested;
		document.getElementById("racismComplete").value=settings.racismComplete;
		document.getElementById("homophobiaNested").value=settings.homophobiaNested;
		document.getElementById("homophobiaComplete").value=settings.homophobiaComplete;
		document.getElementById("drugsNested").value=settings.drugsNested;
		document.getElementById("drugsComplete").value=settings.drugsComplete;
		document.getElementById("explicitNested").value=settings.explicitNested;
		document.getElementById("explicitComplete").value=settings.explicitComplete;
		document.getElementById("bullyingNested").value=settings.bullyingNested;
		document.getElementById("bullyingComplete").value=settings.bullyingComplete;
		
		document.getElementById("customComplete").value=settings.customComplete;
		document.getElementById("customNested").value=settings.customNested;
		
		//document.getElementById('wordListComplete').value = settings.wordListComplete;
		document.getElementById('minWordsPerCategory').value = settings.minWordsPerCategory;
		document.getElementById('hideSentenceMark').value = settings.hideSentenceMark;
		
		document.getElementById('preserveFirst').checked = settings.preserveFirst;
		document.getElementById('showCounter').checked = settings.showCounter;
		document.getElementById('consoleOutput').checked = settings.consoleOutput;

		document.getElementById('hideSentence').checked = settings.hideSentence;
		document.getElementById('filterExtreme').checked = settings.filterExtreme;
		document.getElementById('checkTextInImage').checked = settings.checkTextInImage;

		//document.getElementById('wordListNested').value = settings.wordListNested;
		document.getElementById('wordListExceptions').value = settings.wordListExceptions;
		
		replacers = document.getElementsByName('replacer');
		for (var i = 0, len = replacers.length; i < len; i++)
			replacers[i].checked = false;

		var field = document.getElementById('val' + (parseInt(settings.profanityString)+<1));
		if (field) field.checked = true;
		else this.elements.replacers[3].checked = true;
		
	});
}









/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/




function getDefaultsSetting(){
	return {
		//Complete
		"curseComplete":"bloody,xxx","humiliatingComplete":"ahole","degradingComplete":"caca﻿,bullshit,anus,arse,ass,butt,clusterfuck,motherfuck,bumblefuck,sht,dipshit","blasphemyComplete":"chrissake﻿,goddam,hell,dammit,chrissake","sexismComplete":"clit,cunt,oldbag,tart,puto,puta,hoor,hoore,hore","racismComplete":"whitetrash,nigger,nigga,beaner,spic,gooback,sandmonkey","homophobiaComplete":"fag,queer,homo,faggot,gay,poofster,fags,maricon","explicitComplete":"jism,jiss,jizm,piss,cum,jizz,semen","immodestyComplete":"fellatio,suka,fuck,blowjob,handjob,wank","nudityComplete":"peeenus,peeenusss,peenus,peinus,penus,penuus,vulva,bollocks,dildo,pecker,penis,tits,vag","triumphalismComplete":"","elitismComplete":"bugger,minge","arroganceComplete":"huevon,dickhead,dumbass","isolationismComplete":"","bullyingComplete":"arsehole,carpetmuncher,garbage","drugsComplete":"cocaine,crack,ecstasy,methamphetamine,meth,heroin,mandrax,lsd",
		
		//Nested
		"curseNested":"snatch,beastiality","humiliatingNested":"asshat,asshole,butthole","degradingNested":"crap,diarrhea,merdaputo,mierda,shit","blasphemyNested":"damn","sexismNested":"biatch,whore,bitch,slut","racismNested":"","homophobiaNested":"maricon,faggot","explicitNested":"feck,masturbate,suck","immodestyNested":"flaps","nudityNested":"gash,orto,beaver,clunge,cock,dick,knob,penis,prick,punani,pussy,twat","triumphalismNested":"","elitismNested":"hijueputa,lameass,lardass,pinche,fanny","arroganceNested":"","isolationismNested":"bastard,minge","bullyingNested":"carajo","drugsNested":"",
		
		"customComplete": 'TestABC,TestABCD',
		"customNested": 'TestDEF,TestDEG',
		'wordListComplete': 'bloody,minger',
		'wordListNested': 'arse,retard',
		'filterExtreme': true, 
		'wordListExceptions': 'arsenal,retardant',
		'hideSentence': true, 
		'preserveFirst': false, 
		'showCounter': false, 
		'consoleOutput': false,
		'checkTextInImage': false,
		'minWordsPerCategory':'3',
		'hideSentenceMark':'.',
		'profanityString': '8'
	}
}

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP*****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP*****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP*****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*DOWN****************************/
/****************************************************************************/
















// Add event listeners to DOM
window.addEventListener('load', restore_options);
document.getElementById('toggleProfanity').addEventListener('click',toggleProfanity);
document.getElementById('default').addEventListener('click',restore_defaults);
//document.getElementById('default').addEventListener('click',restore_options);

document.getElementById('save').addEventListener('click',save_options);

document.getElementById('preserveFirst').addEventListener('click',save_options);
document.getElementById('showCounter').addEventListener('click',save_options);
document.getElementById('consoleOutput').addEventListener('click',save_options);
document.getElementById('checkTextInImage').addEventListener('click',save_options);

document.getElementById('minWordsPerCategory').addEventListener('change',save_options);
document.getElementById('hideSentenceMark').addEventListener('change',save_options);

document.getElementById('hideSentence').addEventListener('click',save_options);
document.getElementById('filterExtreme').addEventListener('click',save_options);

document.getElementById('val1').addEventListener('click',save_options);
document.getElementById('val2').addEventListener('click',save_options);
document.getElementById('val3').addEventListener('click',save_options);
document.getElementById('val4').addEventListener('click',save_options);
document.getElementById('val5').addEventListener('click',save_options);
document.getElementById('val6').addEventListener('click',save_options);
document.getElementById('val7').addEventListener('click',save_options);
document.getElementById('val8').addEventListener('click',save_options);
document.getElementById('val9').addEventListener('click',save_options);
document.getElementById('val10').addEventListener('click',save_options);
