chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
    	 console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
        if(request.method == "getText"){
        	//console.log(document.all[0].innerText);
            sendResponse({data: document.all[0].innerText, request: request}); //same as innerText
        }
    }
);