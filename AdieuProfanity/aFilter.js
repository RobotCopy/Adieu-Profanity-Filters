var preserveFirst, showCounter, consoleOutput, checkImgText;
var rateCounter = [0,0,0,0,0,"green",false];
var thisSite = window.location.toString();
var profanityList=[], wordListExceptions=[], hideSentence, profanityString;
var	exceptionList=[],safeReplacement=[],safeIndex=[],filterExtreme;
var minPerCategory,hideSentenceMark;

document.addEventListener('DOMNodeInserted',removeProfanity,false);

//for Youtube -> Experimental
(document.body || document.documentElement).addEventListener('transitionend',checkTransition,true);
window.addEventListener('popstate',checkTransition,true);

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.type === "selectedtext"){
			sendResponse({selectedtext: window.getSelection().toString()});
		}else if(request.type === "selectedpage"){
			var url = window.location;
			if(!url) url = window.location.href;
			sendResponse({selectedurl:url.toString()});
		}
	}
);

filterProfanities();
function filterProfanities(){
	var defaults = {'wordListExceptions':'arsenal,retardant','hideSentence':true, 'preserveFirst':false, 'showCounter':true,'consoleOutput':false,'checkTextInImage': false,'minWordsPerCategory':'2','hideSentenceMark':'#!','profanityString':'0', 'profanityList':['Damn','Bloody'],'exceptionList':['arsenal','retardant'],'safeReplacement':['[curse]','[heck]'],'safeWordsIndex':[0,0,0],'filterExtreme': false};
	
	chrome.storage.sync.get(defaults, function(settings) {
		preserveFirst = settings.preserveFirst;
		minPerCategory = parseInt(settings.minWordsPerCategory);
		hideSentenceMark = settings.hideSentenceMark;
		
		showCounter = settings.showCounter;
		consoleOutput = settings.consoleOutput;
		checkImgText = settings.checkTextInImage;
	  
		wordListExceptions = settings.wordListExceptions.split(',');
		hideSentence = settings.hideSentence;
		profanityString = settings.profanityString;
		
		profanityList = settings.profanityList;
		exceptionList = settings.exceptionList;
		safeIndex = settings.safeWordsIndex;//
		safeReplacement = settings.safeReplacement;
		filterExtreme = settings.filterExtreme;
		
		if(consoleOutput){
			console.log("---------------------------------");
			console.log("APF "+"test              : 0123456796");
			console.log("APF "+"PreserveFirst     : "+preserveFirst);
			console.log("APF "+"ShowCounter       : "+showCounter);

			console.log("APF "+"WordListExceptions: "+wordListExceptions);
			console.log("APF "+"HideSentence      : "+hideSentence);
			console.log("APF "+"ProfanityString   : "+profanityString);

			console.log("APF "+"safeReplacement   : "+safeReplacement);
			console.log("APF "+"safeIndex         : "+safeIndex);
			console.log("---------------------------------");	
		}
		
		removeProfanity();
	});
}

function showResults(){
	if (rateCounter[0] > 0 && showCounter){
		if(rateCounter[6])
			chrome.runtime.sendMessage({counter: rateCounter[0].toString(),color: rateCounter[5]});
		else
			chrome.runtime.sendMessage({counter: rateCounter[0].toString(),color: "none"});
	}else if(rateCounter[0]>0){
		if(rateCounter[6])
			chrome.runtime.sendMessage({counter: "",color: rateCounter[5]});
		else
			chrome.runtime.sendMessage({counter: "",color: "none"});
	}
}

function checkTransition(){
	if((event.target.id !== 'progress') && (event.type !== 'popstate')) return;
	rateCounter=[];
	rateCounter.length=0;
	rateCounter=[0,0,0,0,0,"green",false];
}

function removeProfanity(event){
	var target;
	if(event) target=event.target;
	else target=document
	
	removeProfanityFromSource(target,true,
		function(site,node){
			checkProfanity(site,node,
				function(){
					showResults();
				}
			);
		}
	);
	
	if(checkImgText){
		removeProfanityFromImages(target,true,
			function(){
				showResults();
			}
		);
	}
}

// Not very reliable because random names in attributes
function removeProfanityFromImages(node,count,callback){
	var evalResult = document.evaluate( './/img', 
    node,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);
	var tmpString="";
	var flagProfanity;

  for (var i = 0; i < evalResult.snapshotLength; i++) {
	var imgText = evalResult.snapshotItem(i).title+" "+evalResult.snapshotItem(i).alt+" "+evalResult.snapshotItem(i).name;
	if(evalResult.snapshotItem(i).parentNode.nodeName == 'A')
		imgText+=" "+evalResult.snapshotItem(i).parentNode.href+" "+evalResult.snapshotItem(i).parentNode.title;
	
	flagProfanity = false;
    for (var z = 0; z < profanityList.length; z++) {
		testing=new RegExp(profanityList[z],"gi");
		if(testing.test(imgText)){
			
			if(profanityList[z].substring(0,2)=="\\b"){
				flagProfanity = true;
			}else if(profanityList[z].substring(0,1)=="("){
				tmpString = imgText.replace(new RegExp(profanityList[z],'gi'), caesarShift);
				flagProfanity = true;

				for (var w = 0; w < exceptionList.length; w++) {
					testing=new RegExp(exceptionList[w],"gi");
					if(testing.test(tmpString)){
						tmpString = tmpString.replace(new RegExp(exceptionList[w],'gi'), wordListExceptions[w]);
						flagProfanity = false;
					}
				}
			}
			
			if(flagProfanity){
				incrCounter(safeIndex[z],(count?"node":"document")+"(image)",imgText);
				
				evalResult.snapshotItem(i).src = chrome.extension.getURL("img\\null.png");
				break;
			}
		}
    }
  }
  
  callback();
}

function removeProfanityFromSource(node,count,callback){
	var evalResult = document.evaluate( './/*[not(ancestor-or-self::script or ancestor-or-self::style)]/text()[normalize-space(.) != ""]',
	//+' | .//a[@alt])'+' | .//img[@alt])',
    node, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
	for (var i=0; i<evalResult.snapshotLength;i++){
		var textNode = evalResult.snapshotItem(i);
		flagProfanity = false;
		for(var z=0;z<profanityList.length;z++){
			
			if(profanityList[z].substring(0,5)=="\\b(\\w"){
				testing=new RegExp(profanityList[z],"gi");
			}else if(profanityList[z].substring(0,3)=="\\b("){
				testing=new RegExp(profanityList[z].slice(0,-2)+"(e?[sdr][ys]?|ing?|py|\\soff?|\\sout|\\sby|\\son|\\sit|\\sup)?\\b","gi");
			}else{
				console.log("Error in regular expression: "+profanityList[z]);
			}
			
			if(testing.test(textNode.data)){
				if(profanityList[z].substring(0,5)=="\\b(\\w"){
					if(filterExtreme){
						tmpString=textNode.data.replace(new RegExp("(\\b((piece.)?of|oh|the|an?|to|as|holy|my|your|his|her)\\s+)?"+profanityList[z].slice(2),'gi'),caesarShift);
					}else{
						tmpString=textNode.data.replace(new RegExp("(\\b((piece.)?of|oh|the|an?|to|as|holy|my|your|his|her)\\s+)?"+profanityList[z].slice(2),'gi'),caesarShift);
					}
					flagProfanity = true;
					
					for (var w=0;w<exceptionList.length;w++){
						testing=new RegExp(exceptionList[w],"gi");
						if(testing.test(tmpString)){
							tmpString=tmpString.replace(new RegExp(exceptionList[w],'gi'), wordListExceptions[w]);
							flagProfanity = false;
						}
					}
					
					if(flagProfanity){
						testing=new RegExp("(\\b("+caesarShift("(piece.)?of|oh|the|an?|to|as|holy|my|your|his|her","")+")\\s+)?"+caesarShift(profanityList[z].slice(2),''),'gi');
						if(testing.test(tmpString)){
							if( (profanityString=="3")||(profanityString=="4")||(profanityString=="5")||(profanityString=="6")||(profanityString=="7")||(profanityString=="8") ){
								tmpString=tmpString.replace(new RegExp("(\\b("+caesarShift("(piece.)?of|oh|the|an?|to|as|holy|my|your|his|her","")+")\\s+)?"+caesarShift(profanityList[z].slice(2),''),'gi'), safeReplacement[safeIndex[z]]);
							}else{
								tmpString=tmpString.replace(new RegExp("(\\b("+caesarShift("(piece.)?of|oh|the|an?|to|as|holy|my|your|his|her","")+")\\s+)?"+caesarShift(profanityList[z].slice(2),''),'gi'), charReplaceCaesar);
								
							}
						}
						
						textNode.data=tmpString;
						incrCounter(safeIndex[z],(count?"node":"document")+"(nested sentence)",textNode.data);
					}
				}else if(profanityList[z].substring(0,3)=="\\b("){
					if( (profanityString=="3")||(profanityString=="4")||(profanityString=="5")||(profanityString=="6")||(profanityString=="7")||(profanityString=="8") ){
						if(filterExtreme){
							textNode.data = textNode.data.replace(new RegExp("(\\b((piece.)?of|oh|the|an?|to|as|holy|my|your|his|her)\\s+)?"+profanityList[z].slice(2,-2)+"([e3]?[sdr][ys]?|[i1]ng?|py|\\soff?|\\sout|\\sby|\\son|\\sit|\\sup)?\\b",'gi'),safeReplacement[safeIndex[z]]);
						}else{
							textNode.data = textNode.data.replace(new RegExp("(\\b((piece.)?of|oh|the|an?|to|as|holy|my|your|his|her)\\s+)?"+profanityList[z].slice(2,-2)+"(e?[sdr][ys]?|ing?|py|\\soff?|\\sout|\\sby|\\son|\\sit|\\sup)?\\b",'gi'),safeReplacement[safeIndex[z]]);
						}
					}else{
						if(filterExtreme){
							textNode.data = textNode.data.replace(new RegExp("(\\b((piece.)?of|oh|the|an?|to|as|holy|my|your|his|her)\\s+)?"+profanityList[z].slice(2,-2)+"([e3]?[sdr][ys]?|[i1]ng?|py|\\soff?|\\sout|\\sby|\\son|\\sit|\\sup)?\\b",'gi'),charReplaceSimple);
						}else{
							textNode.data = textNode.data.replace(new RegExp("(\\b((piece.)?of|oh|the|an?|to|as|holy|my|your|his|her)\\s+)?"+profanityList[z].slice(2,-2)+"(e?[sdr][ys]?|ing?|py|\\soff?|\\sout|\\sby|\\son|\\sit|\\sup)?\\b",'gi'),charReplaceSimple);
						}
					}
					
					flagProfanity = true;
					incrCounter(safeIndex[z],(count?"node":"document")+"(complete sentence)",textNode.data+" | expression: "+profanityList[z]);
				}else{
					console.log("What happened?");
				}
			}
		}
		
		if(flagProfanity && hideSentence){
			if(currentSite("youtube")){
				callback("youtube",textNode);
				callback("youtubeThumbs",textNode);
			}else if(currentSite("reddit")){
				callback("reddit",textNode);
			}else if(currentSite("twitter")){
				callback("twitter",textNode);
			}else{
				callback("",textNode);
			}
		}
	}
}

function incrCounter(currentIndex,source,data){
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
		default:
			rateCounter[4]+=1;
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
		console.log("APF "+rateCounter[0]+" From:"+source+" i:"+currentIndex+" Rating:"+rateCounter[5]+" Replacement:"+safeReplacement[currentIndex]+" Sentence:"+data);//.replace(new RegExp("[aeiou]",'gi'),'*'));
		
		console.log("red: "+rateCounter[3]+" | orange: "+rateCounter[2]+" | yellow: "+rateCounter[1]+" | green-another: "+rateCounter[4]);
	}
}

function charReplaceCaesar(strMatchingString, strFirstLetter) {
	return charReplace(strMatchingString, strFirstLetter,true);
}
function charReplaceSimple(strMatchingString, strFirstLetter) {
	return charReplace(strMatchingString, strFirstLetter,false);
}

function charReplace(strMatchingString, strFirstLetter,caesar) {
	var muteString,i; //2
	var starString = '';
	
	if(profanityString=="0") muteString="#$&%##$&%##$&%#";
	else if(profanityString=="1") muteString="***************";
	else if(profanityString=="2"){
		if(preserveFirst && caesar)
			return "[Censored - "+caesarShift(strFirstLetter,'')+"]";
		return "[Censored]";
	}else{ // option 10
		return hideSentenceMark;
	}

	if(!preserveFirst){
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
		
		if((prevChar=="\\")&&(c=="b"||c=="w")){ // experimental to accept \\b as regex
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

function checkProfanity(sourceText,textNode,callback){
	if(!hasClass(textNode.parentNode,"flag")){
		var tempText,tempContent;
		if(sourceText=="reddit"){
			if(hasClass(textNode.parentNode.parentNode,"md")){
				//flag
				tempText   = textNode.parentNode;
				//entry unvoted
				tempContent= textNode.parentNode.parentNode.parentNode.parentNode.parentNode;
				
				hideProfanity(tempText,tempContent,"none");
				textNode.parentNode.className += " flag";
			}
		}else if(sourceText=="youtube"){
			if(hasClass(textNode.parentNode,"comment-renderer-text-content")){
				//textNode.parentNode.parentNode.
				tempText   = findUpClass(textNode,"comment-renderer-text");
				//textNode.parentNode.parentNode.parentNode
				tempContent= findUpClass(textNode,"comment-renderer-content");
				
				hideProfanity(tempText,tempContent,"none");
				textNode.parentNode.className += " flag";
			}
		}else if(sourceText=="youtubeThumbs"){
			if(hasClass(textNode.parentNode,"title")){
				if(hasClass(textNode.parentNode.parentNode.parentNode.parentNode,"related-item-dismissable") || hasClass(textNode.parentNode.parentNode.parentNode.parentNode,"video-list-item")){
					tempText = textNode.parentNode.parentNode.parentNode.parentNode;
					tempContent = textNode.parentNode.parentNode.parentNode.parentNode;
					
					hideProfanity(tempText,tempContent,"thumb");
				}else if(hasClass(textNode.parentNode.parentNode.parentNode.parentNode,"video-list")){
					tempText = textNode.parentNode.parentNode;
					tempContent = textNode.parentNode.parentNode.parentNode;
					
					hideProfanity(tempText,tempContent,"thumbList");
				}else if(hasClass(textNode.parentNode.parentNode.parentNode,"yt-lockup-dismissable")){ //???????????
					tempText = textNode.parentNode.parentNode;
					tempContent = textNode.parentNode.parentNode.parentNode;
					
					hideProfanity(tempText,tempContent,"thumbList");
				}
				
				textNode.parentNode.className += " flag";
			}
		}else if(sourceText=="twitter"){
			if(hasClass(textNode.parentNode,"tweet-text")){
				//tweet-text
				tempText=textNode.parentNode;
				//content
				tempContent=textNode.parentNode.parentNode.parentNode;
				
				hideProfanity(tempText,tempContent,"none");
				textNode.parentNode.className += " flag";
			}
		}else{
			if( isTag(textNode.parentNode,"P") || isTag(textNode.parentNode,"BLOCKQUOTE") || isTag(textNode.parentNode,"SPAN") || isTag(textNode.parentNode,"DIV")){
				tempText=textNode.parentNode;
				tempContent=toUp(tempText,1);
				hideProfanity(tempText,tempContent,"none");
				textNode.parentNode.className += " flag";
			}
		}
	}
	callback();
}
function hideProfanity(tempText,tempContent,thumbYT){
	if((tempText && tempContent) || (tempContent && thumbYT)){
		var linkNode   = document.createElement('a');
		var linkedImage;
		linkNode.class = 'switch';
		linkNode.innerHTML = hideSentenceMark;
		linkNode.style.color = '#128ee9';
		linkNode.style.cursor = 'pointer';
		linkNode.style.zIndex = '999';
		linkNode.style.paddingLeft = '10px';
		linkNode.style.paddingRight = '10px';
		
		if(thumbYT=="none"){
			linkNode.style.float = 'right';
			linkNode.style.marginRight = '10px';
			linkNode.innerHTML='Hide '+hideSentenceMark;
			
			toggleComment(linkNode,tempText);
			linkNode.onclick = function (){toggleComment(linkNode,tempText)};
			tempContent.insertBefore(linkNode,tempContent.childNodes[0]);
		}else{
			if(thumbYT=="thumb"){
				linkNode.style.marginLeft="181px";
				linkNode.style.height="16px";
				linkNode.style.position="static";
			}else if(thumbYT=="thumbList"){
				linkNode.style.width="100%"
				linkNode.style.height="16px";
				linkNode.style.paddingLeft="181px"; //
				linkNode.style.backgroundColor="white"; //
				linkNode.style.paddingLeft = '0px';
			}
			linkNode.style.display="block";
			linkNode.innerHTML='Hide '+hideSentenceMark;
			
			toggleVideoPreview(linkNode,tempText);
			linkNode.onclick = function (){toggleVideoPreview(linkNode,tempText,"thumbList")};
			tempContent.insertBefore(linkNode,tempContent.childNodes[0]);
			
			
			/*linkedImage=findDownTag(tempContent,"IMG");
			printDomPath(linkedImage.parentNode);
			if(linkedImage!=null)
				linkedImage.src = chrome.extension.getURL("img\\null.png");
			*/
		}
	}
}
function toggleComment(linkNode, temp){
	var tmp='Hide '+hideSentenceMark;
    if (linkNode.innerHTML == tmp){
        temp.style.display = "none";
        linkNode.innerHTML = hideSentenceMark;
		linkNode.style.color = '#767676';
    }else{
        temp.style.display = "block";
        linkNode.innerHTML = 'Hide '+hideSentenceMark;
		linkNode.style.color = '#128ee9';
    }
}
function toggleVideoPreview(linkNode2,container,typeThumb){
	var tmp='Hide '+hideSentenceMark;
    if (linkNode2.innerHTML == tmp){
		linkNode2.innerHTML = hideSentenceMark;
        linkNode2.style.color = '#767676';
		
		container.style.height = "16px";
		container.style.position="relative";
		container.style.overflow="hidden";
    }else{
        linkNode2.innerHTML = 'Hide '+hideSentenceMark;
		linkNode2.style.color = '#128ee9';
		linkNode2.style.backgroundColor = 'white';
		
		if(typeThumb=="thumbList") container.style.height = "114px";
		else container.style.height = "94px";
		
		container.style.position="relative";
		container.style.overflow="visible";
    }
}
function currentSite(site){
    if (thisSite.indexOf(site) !=- 1){
        return true;
    }
    return false;
}

function hasClass(target, className){
    return new RegExp('(\\s|^)' + className + '(\\s|$)').test(target.className);
}
function isTag(el,tagnam){
	return(el.tagName === tagnam)
}
function findUpClass(el,classnam){ //max levels to search up?
    while (el.parentNode) {
        el = el.parentNode;
        if (el.className === classnam) {
            return el;
        }
    }
    return null;
}
function findSidesClass(el,classnam){
	var i,children = el.parentNode.childNodes;
	
	for (i=0; i < children.length; i++) {
		if (children[i].className == classnam) {
			return children[i]
		}
	}
	return null;
}

// EXPERIMENTAL
function findDownClass(el,classnam){
	var i,temp,children = el.childNodes;
	
	for (i=0; i < children.length; i++) {
		if (children[i].className == classnam)
			return children[i]
		else
			findDownClass(children[i],classnam);
	}
	return null;
}

function findDownTag(el,tagnam){
	var i,temp,children = el.childNodes;
	
	for (i=0; i < children.length; i++) {
		if (children[i].tagName == tagnam)
			return children[i]
		else
			findDownClass(children[i],tagnam);
	}
	return null;
}

function findIsOrUpTag(el,tagnam){
	if(el.tagName === tagnam) return el; 
    while (el.parentNode) {
        el = el.parentNode;
        if (el.tagName === tagnam) {  //tag or nodeName
            return el;
        }
    }
    return null;
}

function toUp(el,levels){
    while (levels>0) {
        el = el.parentNode;
		levels--;
    }
    return el;
}

function printDomPath(el){
  var stack = [];
  while ( el.parentNode != null ) {
    console.log(el.nodeName);
    var sibCount = 0;
    var sibIndex = 0;
    for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
      var sib = el.parentNode.childNodes[i];
      if ( sib.nodeName == el.nodeName ) {
        if ( sib === el ) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    if ( el.hasAttribute('id') && el.id != '' ) {
      stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
    } else if ( sibCount > 1 ) {
      stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
    } else {
      stack.unshift(el.nodeName.toLowerCase());
    }
    el = el.parentNode;
  }

  //return stack.slice(1); // removes the html element
  
  
	console.log("Path: "+stack.slice(1).join(' > '));
}
