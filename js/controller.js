app.controller('PkPassCtrl', ['$scope', 'xml-helper', function($scope, xmlHelper){
	
	//Helper function to re-render inputs
	$scope.renderInputs = function() {
		setTimeout(function(){componentHandler.upgradeDom()});
	};

	//Helper function to log XML doc
	$scope.logXmlDoc = function(){
		var xml = xmlHelper.getXML('xmldocument');
		console.log(xml);
	};

	//Import an xml document
	$scope.importPkPass = function(pass){
		var textType = /text.*/;
		$scope.file = pass.files[0];		

		if($scope.file.type.match(textType)){
			
			var reader = new FileReader();

			reader.onload = function(e) {
				var fileMin = vkbeautify.xmlmin(e.target.result);
				var parseXml;
				var xmlDoc;

				//ensure xml parsing is available
				if (typeof window.DOMParser != "undefined"){					
					parseXml = function(xmlStr) {
						return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
					}
					xmlDoc = parseXml(fileMin);
				}
				
				if(xmlDoc) {
					$scope.setScopeToXml(xmlDoc);
				}
				$scope.$apply();
				$scope.renderInputs();
			};

			reader.readAsText($scope.file);
			$scope.$apply();
				$scope.renderInputs();
		} else {
			console.log("ERROR: file type not supported..");
		}
	};

	$scope.setScopeToXml = function(xmlDoc) {
		//Get image Guids
		var bgImage = xmlDoc.getElementsByTagName("backgroundImageGuid")[0];
		var logoImage = xmlDoc.getElementsByTagName("logoImageGuid")[0];
		$scope.setScope($scope.pkpass.image, 'background', bgImage);
		$scope.setScope($scope.pkpass.image, 'logo', logoImage);

		//Split the returned date
		var date = xmlDoc.getElementsByTagName("relevantDate")[0];
		if(date){			
			var dateStr = date.innerHTML;
			var dateMom = moment(dateStr);			
			$scope.pkpass.date = dateMom.format('YYYY-MM-DD HH:mm');
			var utcOffset = dateMom.format('ZZ');
			utcOffset = utcOffset.substring(0, utcOffset.length-2) + ':' + utcOffset.substring(utcOffset.length-2);
			$scope.pkpass.timezone = utcOffset;
		}
		
		//Set Colors
		var backgroundColor = xmlDoc.getElementsByTagName("backgroundColor")[0];
		var foregroundColor = xmlDoc.getElementsByTagName("foregroundColor")[0];
		if(backgroundColor){
			var color = backgroundColor.innerHTML;
			if(color.indexOf('#') < 0){
				color = '#' + color;
			}
			$scope.pkpass.backgroundColor = color;
		}
		if(foregroundColor){
			var color = foregroundColor.innerHTML;
			if(color.indexOf('#') < 0){
				color = '#' + color;
			}
			$scope.pkpass.foregroundColor = color;
		}
		
		//Get address from coordinates
		var long = xmlDoc.getElementsByTagName('longitude')[0];
		var lat = xmlDoc.getElementsByTagName('latitude')[0];
		if(long && lat){
			long = long.innerHTML;
			lat = lat.innerHTML;
			var latLng = {
				lat: parseFloat(lat),
				lng: parseFloat(long)
			};

			geocoder.geocode({'location': latLng}, function(results, status){
				if (status === google.maps.GeocoderStatus.OK){
					if(results[0]){
						$scope.pkpass.address = results[0].formatted_address;
						//Force update model
						$scope.$apply();

						$scope.alertUser('locationSuccess', 'locationFail');
					}					
				} else {
					$scope.alertUser('locationFail', 'locationSuccess');
				}

				//update placeholders fix
				var labelList = document.querySelectorAll('.mdl-textfield');
				console.log(labelList);	
				for(i = 0; i < labelList.length; i++){
					labelList[i].MaterialTextfield.checkDirty();
				}
			});
		}

		//Get/Set the upper text fields
		var logoText = xmlDoc.getElementsByTagName("logoText")[0];
		var description = xmlDoc.getElementsByTagName("description")[0];
		$scope.setScope($scope.pkpass, 'logoText', logoText);
		$scope.setScope($scope.pkpass, 'description', description);

		//Set Primary, Secondary, Backfields
		var primary = xmlDoc.getElementsByTagName("primaryFields")[0];
		if(primary) {			
			$scope.findLabelValue(primary, 'primaryLabel', 'primaryValue', false);
		}
		var secondary = xmlDoc.getElementsByTagName("secondaryFields")[0];
		if(secondary) {			
			$scope.findLabelValue(secondary, 'secondaryLabel', 'secondaryValue', false);
		}
		var back = xmlDoc.getElementsByTagName("backFields")[0];
		if(back){
			var back1 = back.getElementsByTagName("field")[0];
			if(back1){
				$scope.findLabelValue(back1, 'na', 'backfield1', true);
			}
			var back2 = back.getElementsByTagName("field")[1];
			if(back2) {
				$scope.findLabelValue(back2, 'na', 'backfield2', true);
			}
			var back3 = back.getElementsByTagName("field")[2];
			if(back3){
				$scope.findLabelValue(back3, 'na', 'backfield3', true);
			}
		}	



		//Apply changes to view
		$scope.$apply();
		$scope.renderInputs();

		//update placeholders fix
		var labelList = document.querySelectorAll('.mdl-textfield');
		for(i = 0; i < labelList.length; i++){
			labelList[i].MaterialTextfield.checkDirty();
		}
	};

	$scope.findLabelValue = function(parent, labelName, valueName, backfield) {
		if(!backfield){
			var label = parent.getElementsByTagName('label')[0];
			$scope.setScope($scope.pkpass, labelName, label);
		}		
		var value = parent.getElementsByTagName('value')[0];		
		$scope.setScope($scope.pkpass, valueName, value);
	};

	$scope.setScope = function(scopeParent, scopeItem, xmlItem){
		if(xmlItem){
			scopeParent[scopeItem] = xmlItem.innerHTML;
		} else {
			scopeParent[scopeItem] = '';
		}		
	};

	//Calculate event start date on date change
	$scope.calculateDate = function() {
		var startDate = moment($scope.pkpass.date);
		var date = startDate.format('YYYY-MM-DD');
		var time = startDate.format('HH:mm:ss');		
		var timezone = $scope.pkpass.timezone;
		if(timezone === ''){
			timezone = '+00:00'
		}
		$scope.pkpass.isoDate = date + 'T' + time + timezone;
		//console.log($scope.pkpass.isoDate);
	};

	//Export Pk Pass
	$scope.getPkPass = function() {
		var xml = xmlHelper.getXML('xmldocument');
		var xmlFormat;
		xmlFormat = vkbeautify.xml(String(xml));
		$scope.xml.output = xmlFormat;
	};

	$scope.alertUser = function(showProp, hideProp) {
		$scope.alert[hideProp] = false;
		$scope.alert[showProp] = true;
		$scope.$apply();
		setTimeout(function(){
			$scope.alert[showProp] = false;
			$scope.$apply();
		}, 900);
	};

	$scope.requestLocation = function(loc){
		//If location is needed
		if(loc){
			geocoder.geocode( {'address' : loc}, function (results, status){
				if (status == google.maps.GeocoderStatus.OK){
					if(results[0]){
						//console.log(results[0]);
						$scope.googleResults = results[0];
						$scope.pkpass.latitude = results[0].geometry.location.lat();
						$scope.pkpass.longitude = results[0].geometry.location.lng();

						//Force update model
						$scope.$apply();

						//Alert user
						$scope.alertUser('locationSuccess', 'locationFail');							
					}
				} else {
					//Alert of Zero Results
					$scope.alertUser('locationFail', 'locationSuccess');
				}
			});
		}		
	};	

	$scope.switchView = function() {
		if ($scope.showFront) {
			$scope.showFront = false;
		} else {
			$scope.showFront = true;
		}
	};

	$scope.file;
	$scope.showFront = true;

	$scope.xml = {};
	$scope.xml.output = '';

	$scope.pkpass = {};
	$scope.pkpass.backgroundColor = '#333333';
	$scope.pkpass.foregroundColor = '#FFFFFF';
	$scope.pkpass.logoText = '';
	$scope.pkpass.description = '';
	$scope.pkpass.primaryLabel = '';
	$scope.pkpass.primaryValue = '';
	$scope.pkpass.secondaryLabel = '';
	$scope.pkpass.secondaryValue = '';
	$scope.pkpass.backfield1 = '';
	$scope.pkpass.backfield2 = '';
	$scope.pkpass.backfield3 = '';

	//Images
	$scope.pkpass.image = {};
	$scope.pkpass.image.background = '';
	$scope.pkpass.image.logo = '';

	//Date
	var now = moment().format('YYYY-MM-DD HH:mm');
	//now.utc();
	$scope.pkpass.date = now;	
	$scope.pkpass.timezone = '';
	$scope.pkpass.isoDate = '';

	//Location
	$scope.googleResults = {};
	$scope.pkpass.latitude = '';
	$scope.pkpass.longitude = '';

	//Alerts
	$scope.alert = {};
	$scope.alert.copySuccess = false;
	$scope.alert.copyFail = false;
	$scope.alert.locationSuccess = false;
	$scope.alert.locationFail = false;
}]);

//Entire card element
app.directive('passbookCard', function() {
	return {
		restrict: 'E',
		templateUrl: './js/templates/passCard.html'
	}
});

//Passbook Settings Element
app.directive('passbookSettings', function() {
	return {
		restrict: 'E',
		templateUrl: './js/templates/passSettings.html',
		link: function($scope){
			$scope.renderInputs();
		}
	}
});

//Passbook Preview Element
app.directive('passbookPreview', function() {
	return {
		restrict: 'E',
		templateUrl: './js/templates/passPreview.html'
	}
});


//PkPass XML document
app.directive('xmlTemplate', function() {
	return {
		restrict: 'A',
		scope: false,
		replace: true,
		templateUrl: './js/templates/samplePkPass.html',
		link: function(scope, element, attributes){

		}
	}
});

app.directive('pkPreview', function() {
	return {
		restrict: 'E',
		templateUrl: './js/templates/pkPreview.html'
	}
});