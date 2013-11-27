"use strict";

function SearchCtrl($scope)
{
	$scope.searchText = '';
	
	$scope.tabs = {};
	$scope.tabArray = [];

	$scope.highlightIndex = 0;

	$scope.updateIndex = 0;
	
	$scope.contentSearchApplyTimer = null;

	$scope.spinner = false;

	$scope.onSearchUpdate = function()
	{
		if ($scope.searchText == '')
		{
			return;
		}

		$scope.updateIndex += 1;

		$scope.searchTextLower = $scope.searchText.toLowerCase();

		console.log($scope.searchText);

		$scope.tabs = {};
		var newTabArray = [];


		chrome.tabs.query({}, function(tabs){
			
			for (var i=0; i<tabs.length; i++)
			{
				var tab = tabs[i];
				if (tab.title.toLowerCase().indexOf($scope.searchTextLower) != -1)
				{
					$scope.tabs[tab.id] = {title: tab.title, type:'t', tab:tab};
					continue;
				}
				if (tab.url.toLowerCase().indexOf($scope.searchTextLower) != -1)
				{
					$scope.tabs[tab.id] = {title: tab.title, type:'u', tab:tab};
					continue;
				}
			}

			for (var key in $scope.tabs) {
			  if ($scope.tabs.hasOwnProperty(key)) {
				newTabArray.push($scope.tabs[key]);
			  }
			}

			$scope.tabArray = newTabArray;
			//console.log($scope.tabArray);
			
			window.clearTimeout($scope.timer);
			
			$scope.spinner = true;
			$scope.timer = window.setTimeout(function(){$scope.searchTabContent($scope.updateIndex)}, 300);
			$scope.$apply();

		});
	}

	$scope.searchHistory = function()
	{
		chrome.history.search({text:$scope.searchTextLower, maxResults:100}, function(results)
		{
			results = results.sort(function(a, b){return (b.lastVisited - a.lastVisited)});
			
			for (var i=0; i < results.length; i++)
			{	var result = results[i];
				console.log(result.title, result.visitCount);
				
				if ((result.title.toLowerCase().indexOf($scope.searchTextLower) != -1) ||
					(result.url.toLowerCase().indexOf($scope.searchTextLower) != -1))
				{
					$scope.tabArray.push({title: result.title, type:'h', url:result.title});
				}
			}			
		});
	}

	$scope.searchTabContent = function(originalUpdateIndex)
	{
		chrome.tabs.query({}, function(tabs){
			
			$scope.numTabsToSearch = tabs.length;
			$scope.numTabsSearched = 0;

			for (var i=0; i<tabs.length; i++)
			{
				var tab = tabs[i];
				chrome.tabs.sendMessage(tab.id, {method: "getText",tab: {title: tab.title, id:tab.id, tab:tab}}, function(response)
				{
					window.clearTimeout($scope.contentSearchApplyTimer);
					$scope.contentSearchApplyTimer = window.setTimeout(function(){$scope.spinner = false; $scope.$apply();}, 100);
					
					if (chrome.runtime.lastError)
					{
						//console.log("Error:", chrome.runtime.lastError);
					}

					// if we kicked off these messages as part of an old update, ignore them!
					if ($scope.updateIndex !== originalUpdateIndex)
					{
						return;
					}

					if (response == undefined)
					{
						//console.log('response undefined');
					}
					else
					{	
						//console.log(response);
						var tab = response.request.tab;
						if (response.data.toLowerCase().indexOf($scope.searchTextLower) != -1)
						{
							console.log("adding page: " + tab.title + "to results");
							//console.log('found your text on tab: ' + tab.title);
							if (!$scope.tabs.hasOwnProperty(tab.id))
							{
								$scope.tabArray.push({title: tab.title, type:'c', tab:tab.tab});
							}
						}
					}
					
				});
			}
		});
	}

	$scope.clamp = function(value, min, max)
	{
		if (value < min)
			return min;

		if (value > max)
			return max;

		return value;
	}

	$scope.moveHighlight = function(delta)
	{
		$scope.highlightIndex += delta;
		$scope.highlightIndex = $scope.clamp($scope.highlightIndex, 0, $scope.tabArray.length-1);
	}

	$scope.checkSwitchTab = function(event)
	{
		if (event.keyCode == 40) // Down arrow
		{
			$scope.moveHighlight(1);
		}
		
		if (event.keyCode == 38) // Up arrow
		{
			$scope.moveHighlight(-1);
		}
		
		if (event.keyCode == 13)
		{
			$scope.switchToTab($scope.tabArray[$scope.highlightIndex].tab);
		}
	}

	$scope.switchToTab = function(tab)
	{
		console.log("Switch tab!");
		chrome.tabs.update(tab.id, {selected: true});

		// Always focus as getting the window ID the popup is running in is
		// unreliable.
		chrome.windows.update(tab.windowId, {focused:true});

		window.close();
	}
}