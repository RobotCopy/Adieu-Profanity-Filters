// v-added (along with several usages)
const squareStyleExtras = "pointer-events:none;";

// Default time options: (1.5,-0.75,2)<-(1.5,-1.5,0.75)
var toMute,showCounter,consoleOutput,delay,minPerCategory;
var cycleTime,muteSentence,wait;
var muteGenerics; // v-added; not used in this file atm; applied in options.js during save
var jumpWords;
/**************************************/
var profanityList=[];
var	exceptionList=[],safeReplacement=[],safeIndex=[];
var thisSite="",lastSite="";
/**************************************/
var limit;
var cycleSec;//cycle is 1.5 cycleTime
/**************************************/
var videoControl;
var progressBar;
var filterLoop;
/**************************************/
var paused=false;
var ended=true;
var flgSound=-1;
var endMuteTime=-1;
var playingTime=0;
var flgProcessed=false;
var doubleCheck;
var doubleCheckLimit=3; //It stars in 1,2,... then doubleCheckLimit>doubleCheck?
// choose language?
/**************************************/
var rateCounter=[]; // Count sentences with bad words (not bad words) in rateCounter[0]
var duration=0;
var wduration=0;
var words=0;
var bwords=0;
/**************************************/

if(inSite("www.youtube",true)){
	(document.body || document.documentElement).addEventListener('transitionend',filterVideoProfanities,true);
	window.addEventListener('popstate',filterVideoProfanities,true);
	
	document.addEventListener('webkitfullscreenchange',correctShow,false);
    document.addEventListener('mozfullscreenchange',correctShow,false);
    document.addEventListener('fullscreenchange',correctShow,false);
    document.addEventListener('MSFullscreenChange',correctShow,false);

	if(inSite("www.youtube.*watch",false)){
		filterYTSoundProfanities(true);
	}else{
		filterYTSoundProfanities(false);
	}
}

function correctShow(event){
	var square=document.getElementById('videoMarkAYTP');
	
	if(square!=null && square.style.display!="none"){
		if(document.webkitIsFullScreen||document.mozFullScreen||document.msFullscreenElement){
			square.setAttribute("style","color:#eee;margin:2% 30% 0 35%;position:absolute;bottom:0;z-index:99;height:56px;width:40%;text-align:center;text-shadow:black 0.1em 0.1em 0.2em;" + squareStyleExtras);
		}else{
			square.setAttribute("style","color:#eee;margin:2% 30% 0 35%;position:absolute;bottom:0;z-index:99;height:37px;width:40%;text-align:center;text-shadow:black 0.1em 0.1em 0.2em;" + squareStyleExtras);
		}
	}
}

function filterVideoProfanities(event){
	if( (event.target.id == 'progress' && event.propertyName === 'width')
		|| (event.type == 'popstate') ){
		ended=true;

		if(inSite("www.youtube.*watch",true)){
			if(getParameterByName(thisSite,"v")!=getParameterByName(lastSite,"v") || (getParameterByName(thisSite,"v")==getParameterByName(lastSite,"v") && !flgProcessed)){
				doubleCheck=1;
				directListenerFilter();
			}
		}else if(inSite("www.youtube",false)){
			if( (rateCounter.length===0) || (rateCounter[5]!="gray") || (rateCounter[0]!=-1) ){
				rateCounter[5]="gray";
				rateCounter[0]=-1;
				chrome.runtime.sendMessage({counter: "",color: "gray"});
				if(filterLoop!==null) clearInterval(filterLoop);
			}
		}
	}else{
		return;
	}
}

function directListenerFilter(){
	flgProcessed=false;
	lastSite=thisSite;
	resetListeners();

	if(showCounter){
		chrome.runtime.sendMessage({counter: "0",color: "gray"});
	}else{
		chrome.runtime.sendMessage({counter: "x",color: "gray"});
	}

	if(filterLoop!==null) clearInterval(filterLoop);
	ended=false;
	resetStats();

	var videoID = getParameterByName(thisSite,"v");
	deleteIntervals();
	showVideoQuery("",false)

	getYouTubeCaptionURL(videoID,
		function(caption_url,duration){
			getCaptions(caption_url,duration,
				function(captions,duration){
					checkCaption(captions,duration,
						function(tempSplit,safeYTIndex){
							drawIntervals(tempSplit,safeYTIndex,
								function(tempSplit){
									if(consoleOutput) console.log("[!] Star processing : "+toDecimals(parseFloat(videoControl.currentTime),2));

									filter(tempSplit);
								}
							);
						}
					);
				}
			);
		}
	);
}

function filterYTSoundProfanities(execFlag){
	if(showCounter){
		chrome.runtime.sendMessage({counter: "0",color: "gray"});
	}else{
		chrome.runtime.sendMessage({counter: "x",color: "gray"});
	}

	if(filterLoop!==null) clearInterval(filterLoop);
	ended=false;

	// todo: merge these defaults with data in restore_options() in options.js
	var defaults = {
		muteSentence: true,
		muteGenerics: false,
		showCounter: true,
		consoleOutput: false,
		delay: '-0.5',
		minWordsPerCategory:'2',
		wait: '1',
		profanityList: ['Damn','Bloody'],
		exceptionList: ['arsenal','retardant','butter'],
		cycleTime:'1.5',
		beepTime:'1',
		jumpWords:false,

		// todo: probably remove (I think these are never used; findSafeReplacement() seems to be used instead)
		safeReplacement: ['[curse]','[heck]'],
		safeWordsIndex: [0,0,0],
	};

	chrome.storage.sync.get(defaults, function(settings) {
		consoleOutput = settings.consoleOutput;//
		muteSentence = settings.muteSentence;//
		muteGenerics = settings.muteGenerics;
		jumpWords = settings.jumpWords;//
		wait = toDecimals(parseFloat(settings.wait),2);//
		delay = toDecimals(parseFloat(settings.delay),2);//
		cycleTimeTmp = toDecimals(parseFloat(settings.cycleTime),2);//
		//beepTime = toDecimals(parseFloat(settings.beepTime),2);//

		minPerCategory = parseInt(settings.minWordsPerCategory);
		showCounter = settings.showCounter;

		profanityList = settings.profanityList;

		exceptionList = settings.exceptionList;
		safeIndex = settings.safeWordsIndex;
		safeReplacement = settings.safeReplacement;

		/**************************************/
		limit=toDecimals(2*cycleTimeTmp,2);
		cycleSec=toDecimals(cycleTimeTmp,2);
		cycleTime = toDecimals(cycleTimeTmp*1000,2);//
		/**************************************/

		if(consoleOutput){
			console.log("YTProfanity |---| "+getParameterByName(thisSite,"v")+" |---|");
			console.log("YTProfanity | jumpWords: "+jumpWords);
		}

		if(execFlag){
			/*********************/
			doubleCheck=1;
			directListenerFilter();
			/*********************/
		}
	});
}

function disableAnnotations(){
	var labels = document.getElementsByClassName("ytp-menuitem-label");
	for (var i=0;i<labels.length;i++){
	  if ((labels[i].innerHTML == "Annotations") && (labels[i].parentNode.getAttribute("aria-checked") == "true")) {
		labels[i].click();
	  }
	}
	var captions = document.getElementsByClassName("ytp-subtitles-button");
	for (var i=0;i<captions.length;i++){
		captions[i].css("display","none");
	}
}

function deleteIntervals(){
	var elements = document.getElementsByClassName('markerAYTPF');
	for(var j=(elements.length-1);j>=0;j--){
		elements[j].parentNode.removeChild(elements[j]);
	}
}

function drawIntervals(listToMute,safeYTIndex,callback){
	var square,width,left,tagsIndex;
	var duration=toDecimals(listToMute[listToMute.length-2][0],2);

	for(var i=1;i<(listToMute.length-2);i++){
		square = document.createElement('div');
		square.className = 'markerAYTPF';

		width=toDecimals(listToMute[i][1]/duration,2)*100;
		if(width<1)width=1;
		left=toDecimals(listToMute[i][0]/duration,2)*100;
		
		if(isIn(i,safeYTIndex)){
			square.setAttribute("style","position:absolute;left:"+left+"%;width:"+width+"%;height:100%;background-color:black;z-index:99;" + squareStyleExtras);
		}else{
			square.setAttribute("style","position:absolute;left:"+left+"%;width:"+width+"%;height:100%;background-color:#8B0000;z-index:99;" + squareStyleExtras);
		}
		progressBar.appendChild(square);
	}

	chrome.runtime.sendMessage({counter: "....",color:rateCounter[5]});
	callback(listToMute);
}

function isIn(index,testList){
	for(var i=0;i<testList.length;i++){
		if(index==testList[i][0]){
			return true;
		}
	}
	return false;
}

function resetListeners(){
	videoControl=document.getElementsByClassName('video-stream')[0];
	progressBar=document.getElementsByClassName('ytp-progress-list')[0];

	/*******************************************************/
	if(videoControl) videoControl.removeEventListener("pause", pauseYT);
	if(videoControl) videoControl.removeEventListener("play", playYT);
	if(videoControl) videoControl.removeEventListener("seeking",seekingYT);
	if(videoControl) videoControl.removeEventListener("seeked",seekedYT);
	if(videoControl) videoControl.removeEventListener("ended",endedYT);
	/*******************************************************/
	videoControl.addEventListener("pause", pauseYT);
	videoControl.addEventListener("play", playYT);
	videoControl.addEventListener("seeking",seekingYT);
	videoControl.addEventListener("seeked",seekedYT);
	videoControl.addEventListener("ended",endedYT);
	/*******************************************************/
}

function resetStats(){
	rateCounter=[];
	rateCounter.length=0;
	rateCounter = [0,0,0,0,0,"green",false];
	duration=0;
	wduration=0;
	words=0;
	bwords=0;
}

function checkSafety(bleepCounter,tagCounter){ //Check and update variables: bleeps, no bleeps
	var speechSpeed,badSpeed;
	var evalString="",flgNoTags=true;

	speechSpeed=toDecimals(words/wduration,1);
	badSpeed=toDecimals((bwords+bleepCounter+tagCounter/4)/wduration,3);

	//Categories: 
	//speechSpeed: 1.2,   1.4,   1.8
	//badSpeed   : 0.002, 0.004, 0.008,
	//	Mute tags {Done}
	//	Mute similar sounds [new textbox -> {word_1},{word_2},...]
	//	Join near sentences
	//	Warning [Looks easy, how to do it?]
	//	Re-evaluate speech with new parameters (not necessary)
	//if((speechSpeed>=1.8)||(badSpeed>=0.008)||((speechSpeed>=1.4)&&(badSpeed>=0.004))){
	if((badSpeed>=0.008)||((speechSpeed>=1.4)&&(badSpeed>=0.004))){
		flgNoTags=false;
	}

	return flgNoTags;
}

function stringStats(){
	var speechSpeed,badSpeed;
	var evalString="";

	speechSpeed=toDecimals(words/wduration,1);
	badSpeed=toDecimals(bwords/wduration,3);

	//Categories: 
	//speechSpeed: 1.2,   1.4,   1.8
	//badSpeed   : 0.002, 0.004, 0.008,
	if(speechSpeed<1.2){
		evalString+="Slow";
	}else if(speechSpeed<1.4){
		evalString+="Paced";
	}else if(speechSpeed<1.8){
		evalString+="Fast";
	}else{
		evalString+="Very Fast";
	}
	evalString+=" ";
	if(badSpeed<=0.0001){
		evalString+="Polite";
	}else if(badSpeed<0.002){
		evalString+="Common";
	}else if(badSpeed<0.004){
		evalString+="Impolite";
	}else if(badSpeed<0.008){
		evalString+="Rude";
	}else{
		evalString+="Very Rude";
	}

	if(consoleOutput){
		//"total: "+rateCounter[0]+" | 
		console.log("Red: "+rateCounter[3]+" | Orange: "+rateCounter[2]+" | Yellow: "+rateCounter[1]+" | Green: "+rateCounter[4]+" | YouTube Tags: "+(rateCounter[0]-bwords));
	}

	return evalString;
}

function pauseYT(){
	paused=true;
	playingTime=toDecimals(videoControl.currentTime,2);
}

function playYT(){
	var playSite = getYTLocation();
	paused=false;
	playingTime=toDecimals(videoControl.currentTime,2);

	if(getParameterByName(playSite,"v")!=getParameterByName(thisSite,"v")){
		thisSite=playSite;
		/************************************/
		doubleCheck=1;
		directListenerFilter();
		/************************************/
	}
}

function seekingYT(){
	if(!jumpWords){
		if(videoControl.muted === false){ //security mute
			videoControl.muted=true;
		}
	}
}

function seekedYT(){
	if(!jumpWords){
		if(videoControl.muted === false){
			videoControl.muted=true;
		}
		var playingTime=toDecimals(videoControl.currentTime,2);

		endMuteTime=playingTime+toDecimals(cycleTime/2000,2);
		setTimeout(muteInstance,cycleTime);
	}
}

function endedYT(){
	paused=true;
}

function incrCounter(currentIndex,beginning,duration,data,counter,type){
	rateCounter[0]+=1;
	switch(currentIndex){
		//red: profanity,sexism,racism,homophobia,drugs,explicit,bullying
		case 3: case 4: case 5: case 6: case 15: case 7: case 14:
			rateCounter[3]+=1;
			break;
		//orange: degrading,humiliating,mentalism,sexual
		case 2: case 1: case 12: case 8:
			rateCounter[2]+=1;
			break;
		//yellow: triumphalism,isolationism,elitism,nudity
		case 10: case 13: case 11: case 9: 
			rateCounter[1]+=1;
			break;
		//curse (case 0:)
		case 0:
			rateCounter[4]+=1;
		default:
			break;
	}
	if(rateCounter[3]>minPerCategory){
		if(rateCounter[5]=="red"){
			rateCounter[6]=false;
		}else{
			rateCounter[5]="red";
			rateCounter[6]=true;
		}
	}else if(rateCounter[2]>minPerCategory){
		if(rateCounter[5]=="orange"){
			rateCounter[6]=false;
		}else{
			rateCounter[5]="orange";
			rateCounter[6]=true;
		}
	}else if(rateCounter[1]>minPerCategory){
		if(rateCounter[5]=="yellow"){
			rateCounter[6]=false;
		}else{
			rateCounter[5]="yellow";
			rateCounter[6]=true;
		}
	}else{
		if(rateCounter[5]=="green"){
			rateCounter[6]=false;
		}else{
			rateCounter[5]="green";
			rateCounter[6]=true;
		}
	}

	if(consoleOutput){
		console.log(rateCounter[0]+"  Star: "+toMinutes(beginning)+"  Time: "+duration+"  Counter: "+counter+"  Type: "+type+"  Rating: "+rateCounter[5]+"  Sentence: "+data);
	}
}

function charReplaceCaesar(strMatchingString, strFirstLetter){
	return charReplace(strMatchingString, strFirstLetter,true);
}

function charReplaceSimple(strMatchingString, strFirstLetter){
	return charReplace(strMatchingString, strFirstLetter,false);
}

function charReplace(strMatchingString, strFirstLetter,caesar){
	var muteString,i;

	if(wait=="0") muteString="#$&%##$&%##$&%#";
	else if(wait=="1") muteString="***************";
	else if(wait=="2"){
		if(toMute && caesar)
			return "[Censored - "+caesarShift(strFirstLetter,'')+"]";
		return "[Censored]";
	}else{
		muteString="xyzxyzxyzxyzxyzxyzxyz";
	}

	var starString = '';

	if(!toMute){
		for(i = 0; i < strMatchingString.length; i++){
			if( (strMatchingString[i]!='(') && (strMatchingString[i]!=')') )
				starString = starString + muteString[i];
		}
	}else{
		if(caesar)
			starString = caesarShift(strFirstLetter,'');
		else
			starString = strFirstLetter;

		for(i = 1; i < strMatchingString.length; i++){
			if( (strMatchingString[i]!='(') && (strMatchingString[i]!=')') )
				starString = starString + muteString[i];
		}
	}

	return starString;
}

function caesarShift(str, firstlet){
	var amount=13;
	var output='';
	var prevChar="";
	for (var i = 0; i < str.length; i ++) {
		var c = str[i];
		
		if((prevChar=="\\")&&(c=="b")){ // experimental to accept \\b as regex
			prevChar="";
		}else{
			if(c=="\\") prevChar=c;
			else prevChar="";
			
			if (c.match(/[a-z]/i)) {
				var code = str.charCodeAt(i);
				if ((code >= 65) && (code <= 90))
					c = String.fromCharCode(((code - 65 + amount) % 26) + 65);

				else if ((code >= 97) && (code <= 122))
					c = String.fromCharCode(((code - 97 + amount) % 26) + 97);

			}
		}
		output += c;
	}
	return output;
}

function getParameterByName(myLink,name){
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),results = regex.exec(myLink);
	if (!results) return null;
	if (!results[2]) return '';

	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getYouTubeCaptionURL(videoID,callback){

	// v-added
	let lang = "en";
	if (true) {
		//const { data } = await fetch(`https://youtube.com/watch?v=${videoID}`);
		const data = document.body.innerHTML;

		// * ensure we have access to captions data
		if (!data.includes('captionTracks')) throw new Error(`Could not find captions for video: ${videoID}`);
	
		const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/;
		const [match] = regex.exec(data);
		const { captionTracks } = JSON.parse(`${match}}`);
	
		const subtitle = captionTracks.find(a=>a.vssId == `.${lang}`)
			|| captionTracks.find(a=>a.vssId == `a.${lang}`)
			|| captionTracks.find(a=>a.vssId && a.vssId.match(`.${lang}`));
		// * ensure we have found the correct subtitle lang
		if (!subtitle || (subtitle && !subtitle.baseUrl)) throw new Error(`Could not find ${lang} captions for ${videoID}`);

		const lengthSeconds = Number(data.match(/"lengthSeconds":"(.+?)"/)[1]);
		console.log("Length in seconds:", lengthSeconds);

		//return subtitle.baseUrl;
		callback(subtitle.baseUrl, lengthSeconds);
		return;
	}

	var videoInfoURL = 'https://www.youtube.com/get_video_info?&video_id='+videoID;
	var x = new XMLHttpRequest();
	var way=0;

	if(consoleOutput) console.log("Info File: "+videoInfoURL);

	x.open('GET', videoInfoURL);
	x.onload = function () {
		var response=x.response;
		var lengthSeconds,tmpSecs;
		var flgErr=0;
		if(response.indexOf('caption_tracks') !== -1){
			var aryData = response.split("&");
			way=1;

			response = aryData.find(function(sentence){
				return (sentence.indexOf('caption_tracks') != -1);
			});
			tmpSecs = aryData.find(function(sentence){
				return (sentence.indexOf('length_seconds') != -1);
			});
			
			//console.log("1 > ");

			if(!tmpSecs || !response){
				flgErr=4;//No data found
			}
		}else if(response.indexOf('&player_response') !== -1){
			var aryData = response.split("&");
			way=2;
			
			response = aryData.find(function(sentence){
				return (/(\bplayer_response\b)/g.test(sentence));
			});
			tmpSecs = aryData.find(function(sentence){
				return (sentence.indexOf('length_seconds') != -1);
			});
			
			//console.log("2 > ");

			if(!tmpSecs || !response){
				flgErr=4;//time error or response error
			}
		}else{
			if(response.indexOf('errorcode=150') !== -1){
				flgErr=1; //Restricted from playback
			}else if(response.indexOf('errorcode=') !== -1){
				flgErr=2 //Not registered error message
			}
			flgErr=3; //No captions found
		}
		
		if(flgErr==0){
			response=decodeURIComponent(response);
			lengthSeconds=parseInt(tmpSecs.replace(/(^.*?=)/gi,''));
			
			
			//console.log("3 > response: "+response);
			//console.log("3 > lengthSeconds : "+lengthSeconds);

			aryData=[];
			aryData.length=0;
			if(way==1){
				aryData = response.split("&");
			}else if(way==2){
				aryData = response.split(",");
			}
			response=[];
			response.length=0;
			
			//console.log("3 > aryData: "+aryData);

			response = aryData.find(function(enSite){
				var tmpSite = decodeURIComponent(enSite);
				return tmpSite.match(/(timedtext.*lang\=en)/);
			});

			if(!response){ //Not so serious but cut functionality
				flgErr=5; //No data. Maybe changed the format of the info file?
			}
		}

		if(flgErr==0){
			
			//console.log("4 > response: "+response);
			response=decodeURIComponent(response);
			if(way==1){
				response=response.replace(/(^.*?u=)|(,v=.*?$)/gi,'');
			}else if(way==2){
				response=response.replace(/(^.*baseUrl":")|("$)/gi,'');
				response=response.replace(/(\\u0026)/gi,'&');
				//console.log("4 > response after: "+response);
			}
			
			/*console.log("4 > response after: "+response);
			response=decodeURIComponent(response);
			console.log("4 > response final: "+response);*/

			if(response.indexOf("youtube")==-1)
				response="https://www.youtube.com"+response;
			//showVideoQuery(".");
			chrome.runtime.sendMessage({counter: ".",color: "green"});
			duration=lengthSeconds;
			callback(response,lengthSeconds);
		}else{
			if(doubleCheck>doubleCheckLimit){
				var errorString,errorShow;
				deleteIntervals();

				switch(flgErr){
					case 1: 
						errorString="Video restricted from playback";
						errorShow="res";
						break;
					case 2: 
						errorString="Not registered error";
						errorShow="err";
						break;
					case 3: 
						errorString="Captions not found";
						errorShow="cap";
						break;
					case 4: 
						errorString="Not time length found";
						errorShow="tim";
						break;
					case 5: 
						errorString="Language data not found";
						errorShow="lan";
						break;
					default:
						errorString="Not recognized error";
						errorShow="???";
						break;
				}

				//console.log(errorString);
				//rateCounter[0]=0;
				resetStats();
				chrome.runtime.sendMessage({counter:errorShow,color:"gray"});
				doubleCheck=1;
				showVideoQuery(errorString,false);
			}else{
				/************************************/
				doubleCheck++;
				directListenerFilter(); //Double check
				/*************************************/
			}
		}
	};
	x.onerror = function () {
		console.log("Error: getYouTubeCaptionURL");
	};
	x.send();
}

function getCaptions(url,duration,callback){
	var listText = [];
	var caption_text = '';
	var x = new XMLHttpRequest();
	var re = new RegExp('(\&lt\;[\/]?font.*?\&gt\;)|(\<text start\=\")|(\<\/text\>)|(.dur\=\")|(\>)|(&nbsp;)|(&amp;)|(&quot;)|(#39;)','gi');
	var tempSplit;

	if(consoleOutput) console.log("Captions File: "+url);

	x.open('GET', url);
	x.onload = function () {
		var s,d,str,i;
		var parser,xmlDoc,aryText,response;

		response = x.response;
		parser = new DOMParser();
		xmlDoc = parser.parseFromString(response, "text/xml");
		aryText = xmlDoc.getElementsByTagName("text");

		for (i = 0; i < aryText.length; i++) {
			s = new XMLSerializer();
			d = aryText[i];
			str = s.serializeToString(d);

			caption_text = str.replace(re,'');
			tempSplit=caption_text.split("\"");
			listText.push([toDecimals(tempSplit[0],2),toDecimals(tempSplit[1],2),tempSplit[2]]);
		}

		if((listText.length>0) && (typeof url !== 'undefined')){
			//showVideoQuery("..");
			chrome.runtime.sendMessage({counter: "..",color: "green"});
			callback(listText,duration);
		}else{
			/*******************/
			if(doubleCheck>doubleCheckLimit){
				deleteIntervals();
				//rateCounter[0]=0;
				resetStats();
				showVideoQuery("Error captions file",false);
				chrome.runtime.sendMessage({counter: "cap",color: "gray"});
				doubleCheck=1;
			}else{
				/**************************************/
				doubleCheck++;
				directListenerFilter(); //Double check
				/**************************************/
			}
		}
	};
	x.onerror = function(){
		console.log("Error: getCaptions");
	};
	x.send();
}

function checkCaption(aryCaptions,duration,callback){
	var listFound = [], listTemp = [];
	var tolerance=-3;
	var minDur=1.5;
	var re;
	var flgDesface;
	var flgDesfaceTmp=false;
	var realDuration;
	var flagProfanity;
	var tmpString;
	var res=[],safe=[];
	var tmpStr,prej;
	var safeYTIndex=[];

	listFound.push([tolerance,0,"",""]);
	for (var j = 0; j < aryCaptions.length; j++) {
		listTemp=aryCaptions[j];
		flgDesface=flgDesfaceTmp;
		flgDesfaceTmp=false;
		flagProfanity=0;
		res.length=0;
		safe.length=0;
		res=[];
		safe=[];

		words+=(listTemp[2].trim().split(/\s+/).length);
		wduration+=listTemp[1];

		for(var z=0;z<profanityList.length;z++){
			re=new RegExp(profanityList[z],'i');
			var re2=new RegExp(profanityList[z],'gi');

			if(re.test(" "+listTemp[2]+" ")){ //?
				tmpString = listTemp[2].replace(re,caesarShift);
				var myMatch,indexes=[],tmpflgPrf=0,flgBreak=false;

				// Detect multiple appearances of the same words in a same sentence
				while((myMatch=re2.exec(" "+listTemp[2]+" "))!= null){
					indexes.push(myMatch[0]);
				}
				re2.lastIndex=0;//reset index

				for(var v=0;v<indexes.length;v++){
					indexes[v]=" "+indexes[v].replace(re,caesarShift)+" ";
				}

				flagProfanity+=indexes.length;//???

				if(safeIndex[z]!=16) bwords+=indexes.length;

				res.push(re2);
				safe.push(safeIndex[z]);

				for(var w = 0; w < exceptionList.length; w++){
					var ree=new RegExp(exceptionList[w],"i");
					for(var v=0;v<indexes.length;v++){
						if(ree.test(indexes[v])){
							tmpflgPrf++;
							res.pop();
							safe.pop();

							if(tmpflgPrf>=indexes.length){
								flgBreak=true;
								break;
							}
						}
					}
					if(flgBreak==true) break;
				}

				if(tmpflgPrf==indexes.length){ // Worse case?
					flagProfanity-=indexes.length;
					if(safeIndex[z]!=16) bwords-=indexes.length;
				}
			}

			if( (muteSentence && flagProfanity>0) || 
				(!muteSentence && 
					(flagProfanity>=2 || 
						(flagProfanity==1 && z==(profanityList.length-1))
					)
				)
			){
				if(j>0){
					realDuration=((listTemp[0]-aryCaptions[j-1][0])+listTemp[1])/2;//average of approximate time and given time
					realDuration=(listTemp[1]<realDuration)?listTemp[1]:realDuration;
				}else{
					realDuration=listTemp[1];
				}

				if( (safe.indexOf(16)==-1) && !muteSentence && (listTemp[2].length>=12) && (realDuration>minDur) && (flagProfanity<=1) ){ //Just word, not sentence
					/*****************************************************************/
					var tol=2;
					var sizeReg=getSize(res[0],profanityList[z]);
					var begToTime=listTemp[2].search(res[0]);
					var endToTime=begToTime+sizeReg;
					var hlfToTime=listTemp[2].length/2;

					listTemp[1]=toDecimals((realDuration/2)>minDur?(realDuration/2):(minDur),2);

					listTemp[0]=toDecimals(listTemp[0]+((begToTime+sizeReg/2)/(profanityList[z].length))*realDuration-(listTemp[1]/2)+delay,2);
					
					listTemp[1]=toDecimals(listTemp[1]+wait,2);
					//listTemp[0]=toTwoDecimals(listTemp[0]+begToTime+(sizeReg/2)-(listTemp[1]/2)+delay);
					/*if((endToTime<hlfToTime)||(begToTime<=tol)){
						listTemp[0]=toDecimals(listTemp[0]+delay,2);
					}else if((begToTime>hlfToTime) || (endToTime>=(listTemp[2].length-1-tol))){
						listTemp[0]=toDecimals(listTemp[0]+realDuration-listTemp[1]+delay,2);
					}else{
						listTemp[0]=toDecimals(listTemp[0]+realDuration/2-listTemp[1]/2+delay,2);
					}*/

					listTemp[3]=profanityList[z];
					listTemp[4]=false;
					
					//listTemp[2]=(" "+listTemp[2]+" ").replace(res[0],safeReplacement[safe[0]]);
					/*if(safe.indexOf(16)!=-1){
						safeYTIndex.push([
							listFound.length,
							(" "+listTemp[2]+" ").replace(res[0],safeReplacement[safe[0]]),
							flagProfanity
						]);
					}*/
					listFound.push(listTemp); 
					
					incrCounter(
						safe[0],
						listTemp[0],
						listTemp[1],
						(j>0?(aryCaptions[j-1][2]):"")+" === "+
							(" "+listTemp[2]+" ").replace(
								res[0],
								safeReplacement[safe[0]]
							)
							+" === "+((j<aryCaptions.length-1)?aryCaptions[j+1][2]:""),
						flagProfanity,
						"Word"
					);

				}else{ //Complete sentence
					//join contiguous sentences //
					if(flgDesface){
						listFound[listFound.length-1][0]+=0;
						listFound[listFound.length-1][1]+=realDuration;
						listFound[listFound.length-1][2]+=" ; "+listTemp[2];
						listFound[listFound.length-1][3]+=" , "+profanityList[z];
						listFound[listFound.length-1][4]=true;
					}else{
						listTemp[0]=toDecimals(listTemp[0]+delay,2);
						listTemp[1]=toDecimals(realDuration+wait,2);
						listTemp[3]=profanityList[z];
						listTemp[4]=false;

						//listTemp[2]=(" "+listTemp[2]+" ").replace(res[0],safeReplacement[safe[0]]);
						if(safe.indexOf(16)!=-1){
							safeYTIndex.push([
								listFound.length,
								(" "+listTemp[2]+" ").replace(res[0],safeReplacement[safe[0]]),
								flagProfanity
							]);
						}
						listFound.push(listTemp); //update=true-> return [true,listTemp]

						tmpStr=(" "+listTemp[2]+" ").replace(res[0],safeReplacement[safe[0]]);

						for(var n=1;n<res.length;n++){
							tmpStr=tmpStr.replace(res[n],safeReplacement[safe[n]]);
						}

						incrCounter(
							safe[0],
							listTemp[0],
							listTemp[1],
							(j>0?(aryCaptions[j-1][2]):"")+" === "+
								tmpStr
								+" === "+((j<aryCaptions.length-1)?aryCaptions[j+1][2]:""),
							flagProfanity,
							"Sentence"
						);
					}
					flgDesfaceTmp=true;
				}
				break;
			}
		}
	}
	listFound.push([duration,0,""]); //Flag element  
	listFound.push([(duration-tolerance),0,""]); //Flag element

	if(listFound.length>3 && !flgProcessed){
		chrome.runtime.sendMessage({counter: "...",color: "green"});
		flgProcessed=true;

		if(showCounter){
			chrome.runtime.sendMessage({counter:(rateCounter[4]+rateCounter[3]+rateCounter[2]+rateCounter[1]).toString(),color: rateCounter[5]});
		}else{
			chrome.runtime.sendMessage({counter: "",color: rateCounter[5]});
		}
		/*var counterBleep=0; // To do ... maybe
		for(var x=0;x<safeYTIndex.length;x++){
			if("\\[\\s*bleep\\s*\\]")
				counterBleep++;
		}*/
		
		
		var tempCounter=0;
		var tempReg=new RegExp("\\[\\s*bleep\\s*\\]",'i');
		for(var z=0;z<safeYTIndex.length;z++){
			if(tempReg.test(safeYTIndex[z][0])){
				tempCounter++;
			}
		}
		
		if(checkSafety(tempCounter,safeYTIndex.length-tempCounter)){
			console.log(">Safe so YouTube tags are not filtered("+safeYTIndex.length+"): applause, music and laughter");

			for(var z=(safeYTIndex.length-1);z>=0;z--){ // Check worst case
				//if(safeYTIndex[z][2]==1){
					//console.log("["+safeYTIndex[z][0]+"] original-sentence: ",listFound[safeYTIndex[z][0]]+" | replaced-sentence: "+safeYTIndex[z][1]);
					console.log("["+safeYTIndex[z][0]+"] original-sentence: ",listFound[safeYTIndex[z][0]]+" | replaced-sentence: "+safeYTIndex[z][1]);

					if(!tempReg.test(safeYTIndex[z][0])){ // Delete all except [bleep]
						listFound.splice(safeYTIndex[z][0],1);
					}
				//}
			}
			
			safeYTIndex=[];
			safeYTIndex.length=0;
		}else{
			console.log(">Not safe so YouTube tags are filtered("+safeYTIndex.length+"): applause, music and laughter");
		}
		/*
		console.log("All captions");
		for(var z=(safeYTIndex.length-1);z>=0;z--){
			console.log("["+safeYTIndex[z][0]+"] original-sentence: ",listFound[safeYTIndex[z][0]]+" | replaced-sentence: "+safeYTIndex[z][1]);
		}*/

		callback(listFound,safeYTIndex);
	}else{
		if(doubleCheck>doubleCheckLimit){
			deleteIntervals();
			if(consoleOutput) console.log(">>>>> 0 No items found <<<<<");

			flgProcessed=true;
			if(showCounter)
				chrome.runtime.sendMessage({counter: "0",color: "green"});
			else
				chrome.runtime.sendMessage({counter: "",color: "green"});

			showVideoQuery("v="+getParameterByName(thisSite,"v")+" > "+stringStats(),true);
			doubleCheck=1;
		}else{
			/************************************/
			doubleCheck++;
			directListenerFilter(); //Double check
			/************************************/
		}
	}
}

function showVideoQuery(preDefault,keep){
	var showControls=document.getElementsByClassName('ytp-chrome-controls')[0];
	var progressControls=document.getElementById('movie_player');
	var square,tmpText;

	tmpText=preDefault;
	//console.log(preDefault+" > "+getParameterByName(thisSite,"v"));
	square=document.getElementById('videoMarkAYTP');
	if(square==null){
		square = document.createElement('div');
		square.id = 'videoMarkAYTP';
		
		if(document.webkitIsFullScreen||document.mozFullScreen||document.msFullscreenElement){
			square.setAttribute("style","color:#eee;margin:2% 30% 0 35%;position:absolute;bottom:0;z-index:99;height:56px;width:40%;text-align:center;text-shadow:black 0.1em 0.1em 0.2em;" + squareStyleExtras);
		}else{
			square.setAttribute("style","color:#eee;margin:2% 30% 0 35%;position:absolute;bottom:0;z-index:99;height:18px;width:40%;text-align:center;text-shadow:black 0.1em 0.1em 0.2em;" + squareStyleExtras);
		}
	}

	square.style.display='block';
	square.style.marginBottom="0";
	square.style.height="25px";
	square.innerHTML=tmpText;
	progressControls.appendChild(square);

	setTimeout(function(k,s,sc){
		if(k){
			s.style.display='block';
			s.style.marginBottom="11px";
			s.style.height="70%";
			sc.appendChild(square);
		}else{
			s.style.display="none";
		}
	},4000,keep,square,showControls);
}

function getSize(re,string){
	var tmpString = string.replace(re,"");
	return (string.length-tmpString.length);
}

function filter(listToMute){
	var vTime=0,lTime,min,prevIndex=0,flgCycle=true,lastVidTime,i;
	var indexCurrent=1;
	var remainingTime;

	if (rateCounter[0] > 0){
		filterLoop = setInterval(function() {
			if(ended){
				clearInterval(filterLoop);
			}else if(!paused){
				lastVidTime=vTime;
				lTime=parseFloat(listToMute[indexCurrent][0]);
				vTime=toDecimals(parseFloat(videoControl.currentTime),2);
				remainingTime=toDecimals(vTime-lTime,2);

				if((vTime-lastVidTime)<(cycleSec*-1)){
					flgCycle=false;
				}else{
					flgCycle=true;
				}

				if(indexCurrent==(listToMute.length-1)){
					paused=true;
				}else if((remainingTime>(-limit)) && (remainingTime<=0)){
					if((indexCurrent!=flgSound) && (indexCurrent!==0)){
						flgSound=indexCurrent;
						if(remainingTime<=0){ // Always true (not previously)
							
							if(!jumpWords){
								setTimeout(function(emt,mit) {
									videoControl.muted= true;
									endMuteTime=emt;
									setTimeout(muteInstance,mit);
								},remainingTime*(-1000),
									listToMute[indexCurrent][0]+listToMute[indexCurrent][1],
									(listToMute[indexCurrent][1]*1000)
								);
							}else{
								videoControl.currentTime=listToMute[indexCurrent][0]+listToMute[indexCurrent][1];
								//videoControl.play();
							}
							
						}

						vTime=toDecimals(videoControl.currentTime,2);
					}
				}else if((remainingTime>=-limit) && flgCycle){
					flgSound=-1;
					lTime=parseFloat(listToMute[(prevIndex<1?1:prevIndex)-1][0]);
					remainingTime=toDecimals(vTime-limit,2);

					for(i=(prevIndex);i<(listToMute.length);i++){ // tolerance error
						min=(vTime+limit)-listToMute[i][0];
						if(min<=0){
							remainingTime=vTime-listToMute[i][0];
							prevIndex=indexCurrent;
							indexCurrent=i;
							break;
						}
					}
				}else if(flgCycle){//>=limit
					flgSound=-1; // No rep because processing EXPERIMENTAL
				}else{
					flgSound=-1; // No rep because processing EXPERIMENTAL
					lTime=parseFloat(listToMute[prevIndex+1][0]);
					remainingTime=toDecimals(((vTime-limit)-lTime),2);

					for(i=(prevIndex);i>=0;i--){
						min=(vTime+limit)-listToMute[i][0];  //(vTime-limit)
						if(min>=0){			//if((min<=0)&&(remainingTime<=min)){ 
							remainingTime=vTime-listToMute[i+1][0];
							prevIndex=i;
							indexCurrent=i+1;
							break;
						}
					}
				}
			}
		}, cycleTime);
	}

	if(showCounter){
		chrome.runtime.sendMessage({counter:(rateCounter[4]+rateCounter[3]+rateCounter[2]+rateCounter[1]).toString(),color: rateCounter[5]});
	}else{
		chrome.runtime.sendMessage({counter: "",color: rateCounter[5]});
	}

	//showVideoQuery("Filter > ",true);
	showVideoQuery("v="+getParameterByName(thisSite,"v")+" > "+stringStats(),true);
}

function toMinutes(seconds){
	return ( (Math.floor(seconds/60)>0)?(Math.floor(seconds/60)): "0" )+":"+ ( (((seconds%60)>9) && ((seconds%60)<-9))?"0":"" )+(seconds>0?(parseInt(seconds%60)):(parseInt(seconds%60)*-1));
}

function toDecimals(num,dec){
    return Number(Math.round(num + 'e' + dec) + 'e-' + dec);
}

/*function toTwoDecimals(num){
	return (parseInt(parseFloat(num)*100)/100);
}

function toDecimals(num,dec){
	var base=1;
	for(var i=0;i<dec;i++){
		base*=10;
	}
	return (parseInt(parseFloat(num)*base)/base);
}*/

function inSite(charSite,update){
	var url;
	if(update){
		url = window.location;  //global variable
		if(!url) url = window.location.href;
		thisSite = url.toString();
	}
	var rege=new RegExp(charSite,'i');

	return rege.test(thisSite);
}

function getYTLocation(){
	return document.getElementsByClassName('ytp-title-link')[0].href;
}

function muteInstance(){
	if(endMuteTime>=0){
		var tmpTime=toDecimals(videoControl.currentTime,2)-endMuteTime;
		if(tmpTime>=0){ //delay is completed
			endMuteTime=-1;
			videoControl.muted=false; //(must check signature or estate?)
		}else{
			setTimeout(muteInstance,cycleTime/5);
		}
	}
}
