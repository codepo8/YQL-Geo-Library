/*
  YQL Geo library by Christian Heilmann
  Homepage: http://isithackday.com/geo/yql-geo-library
  Copyright (c)2010 Christian Heilmann
  Code licensed under the BSD License:
  http://wait-till-i.com/license.txt
*/
var yqlgeo = function(){
  var callback;
  function get(){
    var args = arguments;
    for(var i=0;i<args.length;i++){
      if(typeof args[i] === 'function'){
        callback = args[i];
      }
    }
    if(args[0] === 'visitor'){getVisitor();}
    if(typeof args[0] === 'string' && args[0] != 'visitor'){
      if(args[0]){
        if(/^http:\/\/.*/.test(args[0])){
          getFromURL(args[0]);
        } else if(/^[\d+\.?]+$/.test(args[0])){
          getFromIP(args[0]);
        } else {
          getFromText(args[0]);
        }
      } 
    }
    var lat = args[0];
    var lon = args[1];
    if(typeof lat.join !== undefined && args[0][1]){
      lat = args[0][0];
      lon = args[0][1];
    };    
    if(isFinite(lat) && isFinite(lon)){
      if(lat > -90 && lat < 90 &&
         lon > -180 && lon < 180){
        getFromLatLon(lat,lon);
      }
    }
  }
  function getVisitor(){
    if(navigator.geolocation){
       navigator.geolocation.getCurrentPosition(
        function(position){
          getFromLatLon(position.coords.latitude,
                        position.coords.longitude);
        },
        function(error){
          retrieveip();
        }
      );
    } else{
      retrieveip();
    }
  };

  function getFromIP(ip){
    var yql = 'select * from geo.places where woeid in ('+
              'select place.woeid from flickr.places where (lat,lon) in('+
              'select latitude,longitude from pidgets.geoip'+
              ' where ip="'+ip+'"))';
    load(yql,'yqlgeo.retrieved');
  };

  function retrieveip(){
    jsonp('http://jsonip.appspot.com/?callback=yqlgeo.ipin');
  };

  function ipin(o){
    getFromIP(o.ip);
  };

  function getFromLatLon(lat,lon){
    var yql = 'select * from geo.places where woeid in ('+
              'select place.woeid from flickr.places where lat='+
              lat + ' and  lon=' + lon + ')';
    load(yql,'yqlgeo.retrieved');
  };

  function getFromURL(url){
    var yql = 'select * from geo.places where woeid in ('+
              'select match.place.woeId from geo.placemaker where '+
              'documentURL="' + url + '" and '+
              'documentType="text/html" and appid="")';
    load(yql,'yqlgeo.retrieved');
  }

  function getFromText(text){
    var yql = 'select * from geo.places where woeid in ('+
              'select match.place.woeId from geo.placemaker where'+
              ' documentContent = "' + text + '" and '+
              'documentType="text/plain" and appid = "")';
    load(yql,'yqlgeo.retrieved');
  };

  function jsonp(src){
    if(document.getElementById('yqlgeodata')){
      var old = document.getElementById('yqlgeodata');
      old.parentNode.removeChild(old);
    }
    var head = document.getElementsByTagName('head')[0];
    var s = document.createElement('script');
    s.setAttribute('id','yqlgeodata');
    s.setAttribute('src',src);
    head.appendChild(s);
  };

  function load(yql,cb){
    if(document.getElementById('yqlgeodata')){
      var old = document.getElementById('yqlgeodata');
      old.parentNode.removeChild(old);
    }
    var src = 'http://query.yahooapis.com/v1/public/yql?q='+
              encodeURIComponent(yql) + '&format=json&callback=' + cb + '&'+
              'env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
    var head = document.getElementsByTagName('head')[0];
    var s = document.createElement('script');
    s.setAttribute('id','yqlgeodata');
    s.setAttribute('src',src);
    head.appendChild(s);
  };

  function retrieved(o){
    if(o.query.results !== null){
      callback(o.query.results);
    } else {
      callback({error:o.query});
    }
  };
  return {
    get:get,
    retrieved:retrieved,
    ipin:ipin
  };
}();