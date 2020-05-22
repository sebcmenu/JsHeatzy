

// objet permettant de gérer le processus de connexion en lien avec la popup de saisie de compte
function LoginProvider() {
  this.popup=$('#loginProvider');

  this.setListener=function(loginListener) {
    this.loginListener=loginListener;
  };

  this.provideLogin=function (msg) {
    if (!msg) {
      $("#loginAlert").collapse('hide');
    } else {
      $("#loginAlert").collapse('show');
      $("#loginAlert").text(msg);
    }
    this.popup.modal('show');
    $('#loginProviderSubmit').click($.proxy(function (listener,modal) {
      modal.modal('hide');
      listener.notify($("#login").val(),$("#password").val());

    },null,this.loginListener,this.popup));
  };

}


// Fabrique le calendrier de programmation à partir des éléments chargés
function buildCalendar(acc) {
  var ds=acc.getDevices(initPage);

  var allLoaded=true;
  // looping until every schedule is dowloaded
  ds.forEach(function (item,index,array) {
    var ws=item.getSchedule($.proxy(function(acc) {buildCalendar(acc)},null,acc));
    if (ws==null) {
      allLoaded=false;
    } else {
      updateCalendarView(item,ws);
    }
  });

  if (!allLoaded)
    return;

}

// Initialise l'application, après connexion réussie
function initPage(acc) {

  $("#loginLabel").text(acc.login);
  var ds=acc.getDevices(initPage);

  if (ds==null)
    return;


  var lf=$('#listRoomFilter');
  lf.text("");
  var zs=$('#selectedZone');
  zs.text("");

  // remplit la popup de filtrage d'affichage et de sélection de device
  ds.forEach(function (item,index,array) {
    var e=$('<a class="dropdown-item active" href="#" id="FilterRoom'+index+'" deviceIndex="'+index+'">'+item.alias+'</a>');
    lf.append(e);
    e.data("device",item);
    var e=$('<a class="dropdown-item roomSelect" href="#" id="selectRoom'+index+'" deviceIndex="'+index+'">'+item.alias+'</a>');
    e.data("device",item);
    zs.append(e)
  });

  // gestion des clicks sur le filtrage d'affichage
  lf.on('click','a',$.proxy(function (ds,e) {
    $(this).toggleClass("active");
    var device=$(this).data("device");
    toggleVisibility(device,$(this).hasClass("active"));
    e.stopPropagation();
  },null,ds));

  // gestion de la sélection d'un device
  zs.on('click','a',$.proxy(function (ds) {
    $(".roomSelect").removeClass("active");
    $(this).toggleClass("active");
    $('#butZoneSelector').text($(this).text());
    var device=$(this).data("device");
    $('#butZoneSelector').data("device",device);

    updateRangeList();
  },null,ds));

  // gestion de la sélection d'une programmation
  $("#rangeList").on('click','a',$.proxy(function (ds) {
    $(".rangeSelect").removeClass("active");
    $(this).toggleClass("active");

    var device=$('#butZoneSelector').data("device");
    var wr=$(this).data("wr");
    $("#rangeForm").data("wr",wr);
    $("#rangeForm").removeData("new");

    updateForm();
  },null,ds));

  buildForm();

  initCalendar(ds);

  buildCalendar(acc);

  // gestion de la sauvegarde des modification dans le cloud Heatzy
  $("#saveAll").click(function () {
    $("#saveBox").addClass("invisible");
    var account=$("#allContent").data("account");
    $(account.getDevices(null)).each(function (i,device){
      if (device.isUpdated()) {
        device.saveSchedule();
      }
    });
  });
}


// Met en place le scrolling sur le corps du calendrier, en-tête exclue
// NB : il aurait été plus simple de gérer cette partie à coup de div et de placement CSS en mode grid, mais ça marche avec un tableau, donc on ne va pas refaire ;)
// code honteusement recopié sur stackoverflow...
function adjustScrolling() {
      if ( $('table.body_scroll').length ) {
    var $table_body_scroll=$('table.body_scroll'),
    header_table=$( '<table aria-hidden="true" class="header_table"><thead><tr><td></td></tr></thead></table>' ),
    scroll_div='<div class="body_scroll"></div>';

    //inject table that will hold stationary row header; inject the div that will get scrolled
    $table_body_scroll.before( header_table ).before( scroll_div );

    $table_body_scroll.each(function (index) {
    //to minimize FUOC, I like to set the relevant variables before manipulating the DOM
    var columnWidths = [];
    var $targetDataTable=$(this);
    var $targetHeaderTable=$("table.header_table").eq(index);
    var $targetDataTableFooter=$targetDataTable.find('tfoot');

    // Get column widths
    $($targetDataTable).find('thead tr th').each(function (index) {
      columnWidths[index] = $(this).width();
    });

    //place target table inside of relevant scrollable div (using jQuery eq() and index)
    $('div.body_scroll').eq(index).prepend( $targetDataTable ).width( $($targetDataTable).width()+25 );

    // hide original caption, header, and footer from sighted users
      $($targetDataTable).children('caption, thead, tfoot').hide();

    // insert header data into static table
      $($targetHeaderTable).find('thead').replaceWith( $( $targetDataTable ).children('caption, thead').clone().show() );

    // modify column width for header
    $($targetHeaderTable).find('thead tr th').each(function (index) {
      $(this).css('width', columnWidths[index]);
    });

    // make sure table data still lines up correctly
    $($targetDataTable).find('tbody tr:first td').each(function (index) {
      $(this).css('width', columnWidths[index]);
    });

    //if our target table has a footer, create a visual copy of it after the scrollable div
    if ( $targetDataTableFooter.length ) {
       $('div.body_scroll').eq(index).after('<div class="table_footer">'+ $targetDataTableFooter.text() +'</div>');
    }
    });
    }
   // $("th.timeRange").each(function (index,e) {
   //     $(e).append("<span class='badge badge-primary hour-badge'>"+(index*2)+":00</span>");
   // });


}

// Initialise le calendrier de programmation"à vide", génère la trame
function initCalendar(devices) {
   let nb=devices.length;
   $("#calendarContent").html("");
   var top=$("#calendarContent");
   for (var dProp in DAYS) {
       if (Object.prototype.hasOwnProperty.call(DAYS, dProp)) {
         var d=DAYS[dProp];
         var daySet=false;
         devices.forEach(function (dev) {

           if (!daySet) {
             top.append("<tr id='lined"+d.id+"-none' class='dayLine'></tr>");
             var line=$('#lined'+d.id+"-none");
             line.append("<td id='lined"+d.id+"' rowspan='"+(nb+1)+"' class='daySlot'>"+d.label+"</td>");
             line.append("<td colspan='49'></td>");
             daySet=true;
            }

           top.append("<tr id='lined"+d.id+"-"+dev.id+"' class='calSlots'></tr>");
           var line=$('#lined'+d.id+"-"+dev.id);
            line.append("<td>"+dev.alias+"</td>");
            for (let i=0;i<48;i++) {
              var mode="eco";
              line.append("<td id='mode"+d.id+"-"+dev.id+"-"+i+"' class='"+mode+"' data-toggle='tooltip' data-placement='bottom' title='"+(parseInt(i/2))+":"+((i%2) == 0?"00":"30")+"'>&nbsp;&nbsp;</td>");
            }
         });
       }
   }
   adjustScrolling();
   $(function () {
     $('[data-toggle="tooltip"]').tooltip()
   });

}

// Ajuste la visualisation de la programmation dans le calendrier
function updateCalendarView(device,schedule) {
  for (var dProp in DAYS) {
      if (Object.prototype.hasOwnProperty.call(DAYS, dProp)) {
        var d=DAYS[dProp];
        var ds=schedule.getDaySchedule(d);

        for (let i=0;i<48;i++) {
          $('#mode'+d.id+"-"+device.id+"-"+i).attr("class",ds.getMode(i).clazz);
        }
      }
    }
}

// Gère l'affichage du filtrage des device
function toggleVisibility (dev,vis) {

  for (var dProp in DAYS) {
      if (Object.prototype.hasOwnProperty.call(DAYS, dProp)) {
        var d=DAYS[dProp];
        $('#lined'+d.id+"-"+dev.id).toggle();
        $('#lined'+d.id).attr('rowspan',parseInt($('#lined'+d.id).attr('rowspan'))+(vis?1:-1));
      }
    }
  }

// rafraichit l'ensemble des éléments (liste des programmations du device courrant, affichage de la programmation et formulaire de saisie)
function refreshAll() {
  updateRangeList();
  var device=$('#butZoneSelector').data("device");
  updateCalendarView(device,device.getSchedule(null));
  $("#rangeForm").data("wr",null);
  updateForm();
}

// rafraichit la liste des programmes du device courramment sélectionné
function updateRangeList() {
  var device = $('#butZoneSelector').data("device");
  var ranges=device.getSchedule(null).getRanges();
  $("#newProg").removeAttr("disabled");
  $("#newProg").removeClass("btn-dark");
  $("#newProg").addClass("btn-primary");
  $("#progForm").addClass("invisible");
  var rl=$("#rangeList");
  rl.text("");
  for (i in ranges) {
    var r=ranges[i];
    if (r.getRange().mode != HEATZYMODE.ECO) {
      var label=toHour(r.getRange().from)+" - "+toHour(r.getRange().to)+" ";
      var days=r.getDays();

      // calcul des badges de jours d'activation
      var badge="";
      var badgeColor=r.getRange().mode.btClazz;
      if (days.length==7)
        badge="<span class='badge badge-"+badgeColor+"'>Tous les jours</span>";
      else {
        var nb=0;
        var sum=0;
        for (j in days) {
          nb+=1;
          sum+=days[j].id;
          badge=badge + "<span class='badge badge-"+badgeColor+"'>"+days[j].abbrv+"</span>"

        }
        if (nb==5 && sum==15) {
          badge="<span class='badge badge-"+badgeColor+"'>En semaine</span>";
        } else if (nb==2 && sum==13) {
          badge="<span class='badge badge-"+badgeColor+"'>Weekend</span>";
        }
      }
      label=label+badge;
      var l=$("<a href='#' hashCode='"+r.getRange().hashCode+"' class='rangeSelect list-group-item list-group-item-action flex-column align-items-start'><div class='d-flex w-100 justify-content-between'><div>"+label+"</div><button class='btn btn-danger' hashCode='"+r.getRange().hashCode+"'><small>X</small></button></div></a>");
      l.data("wr",r);
      rl.append(l);

      // fonction de gestion de la sélection d'une programmation
      l.on("click","button",$.proxy(function (wr) {
          var device=$('#butZoneSelector').data("device");
          device.removeRange($(this).attr("hashCode"));
          device.setUpdated(true);
          $("#saveBox").removeClass("invisible");
          $("#rangeForm").removeData("wr");
          $("#rangeForm").removeData("new");
          refreshAll();
      },null,r));
    }
  }
}




// met à jour le formulaire de saisie de programmation
function updateForm() {
    // programmation sélectionné (si sélection)
    var wr=$("#rangeForm").data("wr");
    // indique si on est en train de créer une nouvelle programmation
    var newWr=$("#rangeForm").data("new");
    if (wr==null && !newWr) {
      $("#progForm").addClass("invisible");
      $("#errAlert").alert('close');
      return;
    } else {
      // for some reason, the select options must be reconstructed  otherwise, once browser has interacted with it, jquery can't update the sleected states...
      createSelectInForm();
      $("#progForm").removeClass("invisible");
      $("#fromHourForm option").removeAttr("selected");
      $("#toHourForm option").removeAttr("selected");

      if (!newWr) {
        $('#fromHourVal'+wr.getRange().from).attr("selected","selected");
        $('#toHourVal'+wr.getRange().to).attr("selected","selected");
      } else {
        $('#fromHourVal0').attr("selected","selected");
        $('#toHourVal48').attr("selected","selected");
      }
      $("#fromHourForm").removeClass('invalid');
      $("#toHourForm").removeClass('invalid');

      $("#modePane button").attr("class","btn btn-light");

      var defMode=HEATZYMODE.CONFORT.id;
      if (wr) {
        $(wr.getDays()).each(function (index,item) {
            $("#dayVal"+item.id).attr("selected","selected");
        });
        defMode=wr.getRange().mode.id;
      }
        $("#modePane").data("mode",defMode);
        var activeBut=$("#butMode"+defMode);
        activeBut.removeClass("btn-light");
        activeBut.addClass(activeBut.attr("targetClass"));
    }
}

// Affiche un message d'erreur dans la saisie de programmation
function sendErrMsg(msg) {
  if (!$('#errAlert').length) {
    $('#titleProgForm').append('<span class="alert alert-danger alert-dismissible fade show" role="alert" id="errAlert"><span id="errForm"></span><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></span>');
  }
  $('#errForm').html(msg);
}

// construit les valeurs des select dans le formulaire de programmation
// ce code a été ressorti pour pouvoir etre appelé à chaque maj du formulaire (il y a visiblement un souci d'inteaction entre le DOM et les objets du browser)
// ces multiples appels sont donc des workaround ...
function createSelectInForm () {
  $("#daysForm").text("");
  for(var i in DAYS) {
    var d=DAYS[i];
    $("#daysForm").append("<option id='dayVal"+d.id+"' value='"+d.id+"'>"+d.label+"</option>");
  }

  $("#fromHourForm").text("");
  $("#toHourForm").text("");
  for(let i=0;i<=48;i++) {
    if (i<48)
    $("#fromHourForm").append("<option id='fromHourVal"+i+"' value='"+i+"'>"+toHour(i)+"</option>");
    if (i>0)
    $("#toHourForm").append("<option id='toHourVal"+i+"' value='"+i+"'>"+toHour(i)+"</option>");
  }
}


// construit le formulaire de programmation (appelé 1 fois)
function buildForm() {

  createSelectInForm();

  // vérifie que les horaires des plages ne sont pas inversés
  $("#fromHourForm,#toHourForm").change(function(){

      if (parseInt($("#fromHourForm").val()) >= parseInt($("#toHourForm").val())) {
        $("#fromHourForm").addClass('invalid');
        $("#toHourForm").addClass('invalid');
      } else {
        $("#fromHourForm").removeClass('invalid');
        $("#toHourForm").removeClass('invalid');
      }
  });

  // gère la sélection d'un mode de chauffage pour la programmation
  $('#modePane button').click(function () {
    $("#modePane button").attr("class","btn btn-light");
    var activeBut=$(this);
    activeBut.removeClass("btn-light");
    activeBut.addClass(activeBut.attr("targetClass"));
    $("#modePane").data("mode",activeBut.attr("mode"));
  });

  // gestion du bouton de création de nouvelle programmation
  $("#newProg").click(function () {
    $("#progForm").removeClass('invisible');
    $("#rangeForm").data("new","1");
    $("#rangeForm").removeData("wr");
    $("#rangeSelector a").removeClass("active");
    updateForm();
  });

  // Validation du formulaire de programmation (ie modification de la programmation sélectionnée ou ajour d'une nouvelle programmation)
  $('#validForm').click(function () {
        if ($("#fromHourForm").hasClass('invalid')) {
          sendErrMsg("Les heures de début et de fin sont inversées");
          return;
        }
        var r=new Range(parseInt($("#fromHourForm").val()),parseInt($("#toHourForm").val()),getMode(parseInt($("#modePane").data("mode"))));
        var wr=new WeeklyRange(r);

        $($("#daysForm").val()).each(function (index,item) {
          wr.addDay(getDay(parseInt(item)));
        });
        if (wr.getDays().length == 0) {
          sendErrMsg("Aucun jour sélectionné");
          return;
        }

        var device=$('#butZoneSelector').data("device");
        var current=$("#rangeForm").data("wr");
        if (current) {
          var sch=device.getSchedule(null);
          var ranges=sch.getRanges().slice();
          sch.clear(HEATZYMODE.ECO);
          $(ranges).each(function (index,r) {
              if (r.getRange().hashCode != current.getRange().hashCode) {
                sch.applyRange(r);
              }
          });
        }

        device.getSchedule(null).applyRange(wr);
        device.setUpdated(true);
        $("#saveBox").removeClass("invisible");
        $("#rangeForm").removeData("wr");
        $("#rangeForm").removeData("new");
        //$("#progForm").addClass('invisible');
        refreshAll();
        return false;
  });

  // bouton d'annulation de la saisie du formulaire
  $('#cancelForm').click(function () {
    $("#rangeForm").removeData("new");
    $("#rangeForm").removeData("wr");
    $("#errAlert").alert('close');
    refreshAll();
    return false;
    });
}
