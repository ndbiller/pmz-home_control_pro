// methods for slider manipulation operations
// light slider
var slider0 = document.getElementById("myLightRange");
var output0 = document.getElementById("myLightRangeValue");
output0.value = slider0.value; // display the default slider value
// update the current slider value (each time you drag the slider handle)
slider0.oninput = function() {
    output0.value = this.value;
}
// temperature slider
var slider1 = document.getElementById("myTempRange");
var output1 = document.getElementById("wanted-temp");
output1.value = slider1.value; // display the default slider value
// update the current slider value (each time you drag the slider handle)
slider1.oninput = function() {
    output1.value = this.value;
}

// methods for coffee-machine operations
// filling up the machine
function fillUp() {
  var elemBeans = document.getElementById("beansLevel");   
  var widthBeans = parseInt(elemBeans.innerHTML.split("%")[0]);
  var idBeansUp = setInterval(frameBeansUp, 10);
  function frameBeansUp() {
    if (widthBeans >= 100) {
      clearInterval(idBeansUp);
    } else {
      widthBeans++;
      elemBeans.style.width = widthBeans + '%'; 
      elemBeans.innerHTML = widthBeans * 1  + '%';
    }
  }
  var elemWater = document.getElementById("waterLevel");   
  var widthWater = parseInt(elemWater.innerHTML.split("%")[0]);
  var idWaterUp = setInterval(frameWaterUp, 10);
  function frameWaterUp() {
    if (widthWater >= 100) {
      clearInterval(idWaterUp);
    } else {
      widthWater++;
      elemWater.style.width = widthWater + '%'; 
      elemWater.innerHTML = widthWater * 1  + '%';
    }
  }
}
// brewing a cup of coffee
function brewCup() {
  var elemBeans = document.getElementById("beansLevel");   
  var widthBeans = parseInt(elemBeans.innerHTML.split("%")[0]);
  var elemWater = document.getElementById("waterLevel");   
  var widthWater = parseInt(elemWater.innerHTML.split("%")[0]);
  var widthCup = 20;
  var widthBeansAfterBrewing = parseInt(elemBeans.innerHTML.split("%")[0]) - widthCup; 
  var widthWaterAfterBrewing = parseInt(elemWater.innerHTML.split("%")[0]) - widthCup;
  var enoughBeans = false;
  var enoughWater = false;
  var idWaterDown = ((widthWaterAfterBrewing >= 0) && (widthBeansAfterBrewing >= 0)) ? setInterval(frameWaterDown, 10) : null; // alert("Warning: Water Level is too low! Aborting operation. Please refill water.");
  var idBeansDown = ((widthWaterAfterBrewing >= 0) && (widthBeansAfterBrewing >= 0)) ? setInterval(frameBeansDown, 10) : null; // alert("Warning: Bean Level is too low! Aborting operation. Please refill beans.");
  function frameBeansDown() {
    if (widthBeans <= widthBeansAfterBrewing) {
      clearInterval(idBeansDown);
    } else {
      widthBeans--;
      elemBeans.style.width = widthBeans + '%'; 
      elemBeans.innerHTML = widthBeans * 1  + '%';
    }
  }
  function frameWaterDown() {
    if (widthWater <= widthWaterAfterBrewing) {
      clearInterval(idWaterDown);
    } else {
      widthWater--;
      elemWater.style.width = widthWater + '%'; 
      elemWater.innerHTML = widthWater * 1  + '%';
    }
  }
}

// server interaction
$(function() {
    //====================Heizung======================
    $.ajax({
        url: '/temp/get',
        type: 'GET',
        data: {},
        dataType: 'json'
    }).done(function (data) {
        if (data.status === 'ok') {
            $('#current-temp').val(data.message.ist);
            $('#wanted-temp').val(data.message.soll);
        }
    });

    $('#auto-down').off('click').on('click', function () {
        let ajaxVal = 'off';
        if ($(this).is(':checked')) {
            ajaxVal = 'on';
        }

        $.ajax({
            url: '/temp/set/autodown/',
            type: 'GET',
            data: {value: ajaxVal},
            dataType: 'json'
        });
    });

    $('#wanted-temp').off('focusout').on('focusout', function () {
        $.ajax({
            url: '/temp/set/wanted',
            type: 'GET',
            data: {value: $(this).val()},
            dataType: 'json'
        }).done(function (data) {
            if (data.status === 'ok') {
                $('#wanted-temp').val(data.message)
            }
        });
    });

    //=====================Licht=======================
    $.ajax({
        url: '/light/get/',
        type: 'GET',
        dataType: 'json',
    }).done(function (data) {
        if (data.status === 'OK') {
            $('#licht').val(data.message.licht);
            $('#helligkeit').val(data.message.helligkeit);
            $('#farbtemp').find('option[val="' + data.message.color + '"]').prop('selected', true);
        }
    });

    $('#licht').off('click').on('click', function () {
        let cbValue = 'off';
        if ($(this).is(':checked')) {
            cbValue = 'on';
        }

        $.ajax({
            url: '/light/set/state',
            type: 'GET',
            data: {value: cbValue},
            dataType: 'json'
        });
    });

    $('#helligkeit').off('change').on('change', function () {
        $.ajax({
            url: '/light/set/brightness',
            type: 'GET',
            data: {value: $(this).val()},
            dataType: 'json'
        });
    });

    $('#farbtemp').off('change').on('change', function() {
        $.ajax({
            url: '/light/set/color',
            type: 'GET',
            data: {hexvalue: $(this).find(':selected').val()},
            dataType: 'json'
        });
    });

    //======================Kaffee=======================
    $.ajax({
        url: '/coffee/get',
        type: 'GET',
        dataType: 'json'
    }).done(function (data) {
        let coffeeFillPercentage = data.message.coffee / 255 * 100;
        let waterFillPercentage = data.message.water / 255 * 100;

        $('#beanContainer').find('.fillLevel').css('width', coffeeFillPercentage + '%');
        $('#waterContainer').find('.fillLevel').css('width', waterFillPercentage + '%');
    });

    $('#tasse').off('click').on('click', function () {
        $.ajax({
            url: '/coffee/make',
            type: 'GET',
            dataType: 'json'
        });
    });

    $('#refill').off('click').on('click', function () {
        $.ajax({
            url: '/coffee/refill',
            type: 'GET',
            dataType: 'json'
        });
    });
});