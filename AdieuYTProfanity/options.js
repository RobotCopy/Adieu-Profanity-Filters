// It is Needed to add defaults
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
	]
];

function generateExceptionList(){
	var x, isExtreme, exceptionList=[],wordListEx=[];
	wordListEx = getByIdSplit('wordListExceptions');

	for (x = 0; x < wordListEx.length; x++){
		exceptionList.push(caesarShift2(wordListEx[x]));
	}

	return exceptionList;
}

function generateProfanityList(){
	var x, y, i, profanityList=[], wordListComplete=[], wordListNested=[];
	//wordListComplete = document.getElementById('wordListComplete').value.split(',');
	//wordListNested = document.getElementById('wordListNested').value.split(',');
	//var wlc=wordListComplete.length;
	//var wn=wordListNested.length;

	for(i=0;i<profanityCategories.length;i++){
		for(x=0;x<profanityCategories[i].length;x++){
			wordListComplete=getByIdSplit(profanityCategories[i][x][0]+"Complete");
			for(y=0;y<wordListComplete.length;y++){
				profanityList.push('\\b(' + wordListComplete[y][0] + ')' + wordListComplete[y].substring(1) + '(e?[sdr][ys]?|ing?|py)?\\b'); 
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

	// Check that "findSafeWord" have the same words
	profanityList.push("\\[\\s*bleep\\s*\\]");
	profanityList.push("\\[\\s*applause\\s*\\]");
	profanityList.push("\\[\\s*music\\s*\\]");
	profanityList.push("\\[\\s*laughter\\s*\\]");
	profanityList.push("\\[\\s*cheers\\sand\\sapplause\\s*\\]");

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
	for(var i=0;i<str.length;i++){
		var c = str[i];
		if(c.match(/[a-z]/i)){
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
	for (x = 0; x < wordList.length; x++){
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
				case "g":
				case "j":
					tmpString+="[gj]";
					break;
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

function findSafeReplacement(){
	//return ["[tolerance]","[discriminatory]","[threat]","[tolerance]","[discriminatory]","[discriminatory]","[discriminatory]","[sex]","[sex]","[nudity]","[discriminatory]","[discriminatory]","[discriminatory]","[antisocial]","[violence]","[substances]"];

	return ["[curse]","[humiliating]","[degrading]","[blasphemy]","[sexism]","[racism]","[homophobia]","[explicit]","[immodesty]","[nudity]","[triumphalism]","[elitism]","[arrogance]","[isolationism]","[bullying]","[drugs]","{YT}"];
}

function findSafeWord(){
	//var wordListComplete=[], wordListNested=[];
	var listIndex=[];
	//var wlc=wordListComplete.length,wln=wordListNested.length;
	var categoryList,lengthList;

	//wordListComplete = document.getElementById('wordListComplete').value.split(',');
	//wordListNested = document.getElementById('wordListNested').value.split(',');

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

	//generateProfanityList: YouTube category
	listIndex.push(16);
	listIndex.push(16);
	listIndex.push(16);
	listIndex.push(16);
	listIndex.push(16);

	return listIndex;
}

/*******************************************************************************/
function update_status(message, error, timeout){
	var status = document.getElementById('status');
	if (error) {status.className = 'error';}
	status.textContent = message;
	setTimeout(function(){status.textContent='';status.className='';},timeout);
}

function save_options(){
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

	//settings.wordListComplete = document.getElementById('wordListComplete').value;
	//settings.wordListNested = document.getElementById('wordListNested').value;
	settings.wordListExceptions = document.getElementById('wordListExceptions').value;

	//settings.beepTime = document.getElementById('beepTime').value;
	//settings.filterExtreme = document.getElementById('filterExtreme').checked;
	settings.toMute = document.getElementById('toMute').checked;
	settings.muteSentence = document.getElementById('muteSentence').checked;
	settings.delay = document.getElementById('delay').value;

	settings.minWordsPerCategory = document.getElementById('minWordsPerCategory').value;
	settings.jumpWords = document.getElementById('jumpWords').checked;
	settings.cycleTime = document.getElementById('cycleTime').value;
	settings.showCounter = document.getElementById('showCounter').checked;
	settings.consoleOutput = document.getElementById('consoleOutput').checked;
	settings.wait = document.getElementById('wait').value;

	settings.safeWordsIndex = findSafeWord();
	settings.profanityList = generateProfanityList();
	settings.exceptionList = generateExceptionList();
	settings.safeReplacement = findSafeReplacement();

	chrome.storage.sync.set(settings, function(){
		if(chrome.runtime.lastError){
			update_status('Settings not saved! Please try again.', true, 5000);
		}else{
			update_status('Settings saved successfully!', false, 3000);
			if (document.getElementById('profanityListing').style.display === 'block'){
				toggleProfanity();
			}
		}
	});
}

function restore_defaults(){
	chrome.storage.sync.clear(function(){
		if(chrome.runtime.lastError){
			update_status('Error restoring defaults! Please try again.', true, 5000);
		}else{
			restore_options();
			update_status('Default settings restored!', false, 3000);
		}
	});
}

function toggleProfanity() {
	var profanityListing = document.getElementById('profanityListing');
	var optionsListing = document.getElementById('options');

	if(profanityListing.style.display === 'none'){
		//document.getElementById('wordListComplete').focus();

		profanityListing.style.display = 'block';
		optionsListing.style.display = 'none';
		document.getElementById('listWarning').style.display = 'none';
		document.getElementById('toggleProfanity').textContent = "Return to Main Options";
	}else{
		profanityListing.style.display = 'none';
		optionsListing.style.display = 'block';
		document.getElementById('listWarning').style.display = 'block';
		document.getElementById('toggleProfanity').textContent = "Modify Profanity List";
	}
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



function restore_options() {
	var defaults = {
		//Complete
		"curseComplete":"bloody,xxx","humiliatingComplete":"ahole","degradingComplete":"caca﻿,bullshit,anus,arse,ass,butt,clusterfuck,motherfuck,bumblefuck,sht,dipshit","blasphemyComplete":"chrissake﻿,goddam,hell,dammit,chrissake","sexismComplete":"clit,cunt,oldbag,tart,puto,puta,hoor,hoore,hore","racismComplete":"whitetrash,nigger,nigga,beaner,spic,gooback,sandmonkey","homophobiaComplete":"fag,queer,homo,faggot,gay,poofster,fags,maricon","explicitComplete":"jism,jiss,jizm,piss,cum,jizz,semen","immodestyComplete":"fuck,fellatio,suka,blowjob,handjob,wank","nudityComplete":"peeenus,peeenusss,peenus,peinus,penus,penuus,vulva,bollocks,dildo,pecker,penis,tits,vag","triumphalismComplete":"","elitismComplete":"bugger,minge","arroganceComplete":"huevon,dickhead,dumbass","isolationismComplete":"","bullyingComplete":"arsehole,carpetmuncher,garbage","drugsComplete":"cocaine,crack,ecstasy,methamphetamine,meth,heroin,mandrax,lsd",
		
		//Nested
		"curseNested":"snatch,beastiality","humiliatingNested":"asshat,asshole,butthole","degradingNested":"crap,diarrhea,merdaputo,mierda,shit","blasphemyNested":"damn","sexismNested":"biatch,whore,bitch,slut","racismNested":"","homophobiaNested":"maricon,faggot","explicitNested":"feck,masturbate,suck","immodestyNested":"flaps","nudityNested":"gash,orto,beaver,clunge,cock,dick,knob,penis,prick,punani,pussy,twat","triumphalismNested":"","elitismNested":"hijueputa,lameass,lardass,pinche,fanny","arroganceNested":"","isolationismNested":"bastard,minge","bullyingNested":"carajo","drugsNested":"",

		//'wordListComplete': 'bloody,minger',
		//'wordListNested': 'arse,retard', 
		'wordListExceptions': 'arsenal,retardant' ,
		'muteSentence': true, 
		'toMute': false, 
		'showCounter': true, 
		'consoleOutput': false,
		'delay': '-0.5',
		'minWordsPerCategory':'2',
		'wait': '1',
		'cycleTime':'1.5',
		'beepTime':'1',
		'jumpWords':false
	};
	
	
	
/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP******************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP******************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP******************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP******************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP******************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP******************************/
/****************************************************************************/

/****************************************************************************/
/**************************WARNING*BAD*WORDS*UP******************************/
/****************************************************************************/























	chrome.storage.sync.get(defaults, function(settings) {
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

		//document.getElementById('wordListComplete').value = settings.wordListComplete;
		//document.getElementById('wordListNested').value = settings.wordListNested;
		document.getElementById('wordListExceptions').value = settings.wordListExceptions;

		//document.getElementById('beepTime').value = settings.beepTime;
		//document.getElementById('filterExtreme').checked = settings.filterExtreme;
		document.getElementById('toMute').checked = settings.toMute;
		document.getElementById('muteSentence').checked = settings.muteSentence;
		document.getElementById('delay').value = settings.delay;
		document.getElementById('wait').value = settings.wait;

		document.getElementById('minWordsPerCategory').value = settings.minWordsPerCategory;
		document.getElementById('jumpWords').checked = settings.jumpWords;
		document.getElementById('cycleTime').value = settings.cycleTime;
		document.getElementById('showCounter').checked = settings.showCounter;
		document.getElementById('consoleOutput').checked = settings.consoleOutput;

	});
}

window.addEventListener('load',restore_options);
document.getElementById('toggleProfanity').addEventListener('click',toggleProfanity);
document.getElementById('default').addEventListener('click',restore_defaults);
document.getElementById('save').addEventListener('click',save_options);

document.getElementById('beepTime').addEventListener('change',save_options);
document.getElementById('toMute').addEventListener('click',save_options);
document.getElementById('muteSentence').addEventListener('click',save_options);
document.getElementById('delay').addEventListener('change',save_options);

document.getElementById('minWordsPerCategory').addEventListener('change',save_options);
document.getElementById('jumpWords').addEventListener('click',save_options);
document.getElementById('cycleTime').addEventListener('change',save_options);
document.getElementById('showCounter').addEventListener('click',save_options);
document.getElementById('consoleOutput').addEventListener('click',save_options);
document.getElementById('wait').addEventListener('change',save_options);

/*document.getElementById('val1').addEventListener('click',save_options);
document.getElementById('val2').addEventListener('click',save_options);
document.getElementById('val3').addEventListener('click',save_options);
document.getElementById('val4').addEventListener('click',save_options);
document.getElementById('val5').addEventListener('click',save_options);
document.getElementById('val6').addEventListener('click',save_options);
document.getElementById('val7').addEventListener('click',save_options);
document.getElementById('val8').addEventListener('click',save_options);
document.getElementById('val9').addEventListener('click',save_options);*/
																																		