
// fonction "herlper" pour créer les px_datay de la programmation d'un device
function fillScheduleData(sch) {
    var result={};
    for (d in DAYS){
      var dw=DAYS[d];
      if (dw.id) {
      var ds=sch.getDaySchedule(dw);
      var cycle=0;
      var value=0;
      for (var index=47;index>=0;index--) {
    			value=value<<2;
    			value+=ds.getMode(index).id;
    			cycle++;
    			if (cycle==4) {
    				result["p"+dw.id+"_data"+((index/4)+1)]=value;
    				cycle=0;
    				value=0;
    			}
    		}
    	}
    }
    return result;
}

// objet de gestion de l'interface avec l'API Heatzy
function HeatzyAPI() {
    this.BASEURL= "https://euapi.gizwits.com/";
	  this.APPID = "c70a66ff039d41b4a220e198b0fcc8b3";
	  this.APPID_H = "X-Gizwits-Application-Id";
	  this.TOKEN_H = "X-Gizwits-User-token";

    // connexion
    this.connect=function (login,password,account,callback) {

      $.post({
        url: this.BASEURL+"app/login",
        data: JSON.stringify({ username:login, password:password }),
        contentType: 'application/json; charset=utf-8',
        headers : { "X-Gizwits-Application-Id" : this.APPID},
        success: function (data) {
          account.setToken(data.token);
        },
        error: function(data) {
          var msg="Echec de connexion, veuillez réessayer";
          if (data.responseJSON.error_code==9015) {
            msg="Merci de remplir Identifiant ET mot de passe";
          } else if (data.responseJSON.error_code==9020) {
            msg="Compte inconnu ou mot de passe erroné";
          }
          callback(msg);
        },
        dataType: "json"
      });
    };

    // lister les device
    this.listDevices=function (account,callback) {

      $.get({
        url: this.BASEURL+"app/bindings",
        data: { limit: 20, skip: 0 },
        contentType: 'application/json; charset=utf-8',
        headers : { "X-Gizwits-Application-Id" : this.APPID,
            "X-Gizwits-User-token":account.getToken()},
        success: function (data) {
          var resp=eval(data);
          var devices=new Array();
          resp.devices.forEach(function (item) {
            devices.push(new Device(account,item));
          });
          account.setDevices(devices);
          callback(account);
        },
        dataType:"json",

        // error: function(data) {
        //   var msg="Echec de connexion, veuillez réessayer";
        //   if (data.responseJSON.error_code==9015) {
        //     msg="Merci de remplir Identifiant ET mot de passe";
        //   } else if (data.responseJSON.error_code==9020) {
        //     msg="Compte inconnu ou mot de passe erroné";
        //   }
        //   callback(msg);
        // },

      });
    };

    // charger la programmation d'un device (conversion des px_datay dans le modèle objet)
    this.loadSchedule=function (device,did,account,callback) {

      $.get({
        url: this.BASEURL+"app/devdata/"+did+"/latest",
        contentType: 'application/json; charset=utf-8',
        headers : { "X-Gizwits-Application-Id" : this.APPID,
            "X-Gizwits-User-token":account.getToken()},
        success: function (data) {
          var resp=eval(data);
          var schData=resp.attr;

          var wr=new Schedule();
          device.setSchedule(wr);
          for (var d in DAYS) {
              if (Object.prototype.hasOwnProperty.call(DAYS, d)) {
                var ds=wr.getDaySchedule(DAYS[d]);
                ds.clear(HEATZYMODE.ECO);
                for (let i=1;i<13;i++) {
                   var key = "p"+DAYS[d].id+"_data"+i;
                   if (Object.prototype.hasOwnProperty.call(schData,key)) {
                     var v=schData[key];
                     let cycle=0;
                     while (cycle<4) {
                       ds.setModeAt(v % 4,(i-1)*4+cycle);
                       v=v>>2;
                       cycle++;
                     }
                   } else {
                     console.log("no "+key+" in "+JSON.stringify(schData));
                   }
                 }
              }
          }
          if (callback)
            callback();
        },
        complete: function() {
          device.loadingInProgress=false;
        },
        dataType:"json",


      });
    };

    // sauvegarder la programmation d'un device dans le cloud
    this.saveSchedule=function (account,device) {
      var prog=fillScheduleData(device.getSchedule(null));

      $.post({
        url: this.BASEURL+"app/control/"+device.id,
        contentType: 'application/json; charset=utf-8',
        data:JSON.stringify({attrs:prog}),
        headers : { "X-Gizwits-Application-Id" : this.APPID,
            "X-Gizwits-User-token":account.getToken()},
        success: function (data) {
          device.setUpdated(true);
        },

        dataType:"json",


      });
    };
}
