$(document).ready(function(){
    var xhrCount = null;
    var oldRequest = null;
    var createPopup = $('.popup-content').length ? true : false;

    function formInputsActions(formSelector, disableAttr, isSubmit = false) {
        var blackList = ['make', 'model'];

        var form = formSelector;
        if (disableAttr) {
            form.find("input").filter(function(){ return !this.value; }).attr("disabled", "disabled");
            form.find("select").filter(function(){ return !this.value || (isSubmit && blackList.includes(this.getAttribute('name'))); }).attr("disabled", "disabled");
            if ($("#price-from-input").val() == "" && $("#price-to-input").val() == "") {
                $("#currency-select").attr('disabled', 'disabled');
            };
        } else {
            form.find("input").filter(function(){ return !this.value; }).removeAttr("disabled");
            form.find("select").filter(function(){ return !this.value || (isSubmit && blackList.includes(this.getAttribute('name'))); }).removeAttr("disabled");
            $("#currency-select").removeAttr('disabled', 'disabled');
        };
    };

    // map init
    if ($("#map").length || $(".map-modal").length) {
        DG.then(function () {
            if ($("#map").length) {
                var map, markers = DG.featureGroup();;
                map = DG.map('map', {
                    center: mapCenter,
                    zoom: 13,
                    minZoom: 12,
                    zoomDelta: 0.5,
                    doubleClickZoom: false,
                    zoomControl: false,
                    fullscreenControl: false
                });
                $("#map").removeClass('loading');     
                if (typeof dealerLatLng !== 'undefined' && dealerLatLng.length) {
                    for (let i = 0; i < dealerLatLng.length; i++) {
                        if (dealerLatLng[i].lat != "" && dealerLatLng[i].lng != "") {
                            var marker = DG.marker([parseFloat(dealerLatLng[i].lat), parseFloat(dealerLatLng[i].lng)], {draggable: false, id: dealerLatLng[i].id});
                            if (createPopup) {
                                marker.bindPopup("", {closeButton: false, className: "popup", id: dealerLatLng[i].id, minWidth: 285, maxWidth: 285, minHeight: 44, maxHeight: 500}).addTo(markers);
                            }
                            marker.addTo(markers);
                        };
                    };  
                    if (markers.getLayers().length) {
                        markers.addTo(map);
                        map.fitBounds(markers.getBounds(), {padding: [1.5, 1.5]});
                    }
                };
    
                $("a.location").on('click', function(){
                    var $this = $(this);
                    markers.eachLayer(function (layer) {
                        if (layer.options.id == $this.data('id')) {
                            map.closePopup();
                            layer.openPopup();
                        }
                    });
                });
                map.on('popupopen', function (e) {
                    map.setView(e.target._popup._latlng, e.target._zoom);
                    var popupContent = $(e.popup.getElement()).find('.leaflet-popup-content-wrapper').find('.leaflet-popup-content');
                    popupContent.append($(".dealer.dealer-"+e.popup.options.id).children(".popup-content").clone());
                });
            };
            if ($(".map-modal").length) {
                $(".map-modal").each(function (index, element) {
                    var $this = $(element);
                    var mapModal = DG.map($this.attr('id'), {
                        center: $this.data('latlng').split("|"),
                        zoom: 13,
                        minZoom: 12,
                        zoomDelta: 0.5,
                        doubleClickZoom: false,
                        zoomControl: false,
                        fullscreenControl: false
                    });
    
                    DG.marker($this.data('latlng').split("|"), {draggable: false}).addTo(mapModal);

                    $(".modal").on("shown.bs.modal", function(){
                        mapModal.invalidateSize();
                    });
                });
            };
        });
    };
    // end map init

    // brazzers carousel init
    $(".thumb-item").brazzersCarousel();
    // end brazzers carousel init

    // selectpicker initialization
    $('.selectpicker').each(function (index, element) {
        $(element).selectpicker({
            actionsBox: true,
            deselectAllText: $(element).data('reset'),
            noneResultsText: ''
        }).ready(function(){
            if ($(element).data('value')) {
                $(element).removeAttr('multiple').selectpicker('val', $(element).data('value')).attr('multiple', 'multiple').selectpicker('refresh');
            };
            if ($(element).val()) {
                $(element).parent().parent().children('span.placeholder').addClass('active');
            } else if ($(element).is(":disabled")) {
                $(element).parent().parent().children('span.placeholder').addClass('disabled');
            };
        });
    });
    if ($('div.bootstrap-select').length == $('select.selectpicker').length) {
        $('.filter-selection').removeClass("loading");
    };
    // end selectpicker initialization

    // mark model select
    $('.bootstrap-select.mark-select').find('.bs-actionsbox .bs-deselect-all').on('click', function(){
        if ($('.bootstrap-select.mark-select').find('.bs-searchbox input').val() != "") {
            $('.bootstrap-select.mark-select').find('.bs-searchbox input').val('').trigger('propertychange');
        }
    });

    $('select#mark-select').on('change.bs.select', function(){
        var modelSelector = $('select#model-select'),
            value = $(this).val();

            modelSelector.empty();
        if (value == "default" || value == null || value == []) {
            modelSelector.attr('disabled', 'disabled').val('').selectpicker('refresh'); 
            modelSelector.parent().parent().children('span.placeholder').removeClass('active').addClass('disabled');
            return false;
        } else {
            modelSelector.empty('').removeAttr('disabled');
            modelSelector.parent().parent().children('span.placeholder').removeClass('active disabled');
        }

        var inviteList = [];
        for (var i = 0; i < makeArr.length; i++) {
            if (value == makeArr[i]['id']) {
                for (var j = 0; j < makeArr[i].models.length; j++) {
                    inviteList.push({
                        text: makeArr[i]['models'][j]['name'],
                        value: makeArr[i]['models'][j]['id'],
                        popular: makeArr[i]['models'][j]['is_popular'],
                        slug: makeArr[i]['models'][j]['slug']
                    });
                }
            }
        }

        modelSelector.append('<optgroup id="popular" label="'+ modelSelector.data('popular') +'"></optgroup>','<optgroup id="all" label="'+ modelSelector.data('all') +'"></optgroup>');
        for (var j = 0; j < inviteList.length; j++) {
            if (inviteList[j].popular == 1) {
                modelSelector.find("optgroup#popular").append('<option value="' + inviteList[j].value + '" data-slug="' + inviteList[j].slug + '">' + inviteList[j].text + '</option>');
            }
            if (inviteList[j].value != 'default') {
                modelSelector.find("optgroup#all").append('<option value="' + inviteList[j].value + '" data-slug="' + inviteList[j].slug + '">' + inviteList[j].text + '</option>');
            }
        };
        modelSelector.selectpicker('refresh'); 
    });
    // end mark model select

    // paste multiple select values for input
    $('select.selectpicker[multiple]').not('[data-max-options=1]').on('change.bs.select', function () {
        if ($(this).val() != null && $(this).val() != "") {
            $('input[name='+ $(this).data('name') +']').val($(this).val().join(','))
        } else {
            $('input[name='+ $(this).data('name') +']').val('')
        };
    }).trigger('change');
    // end paste multiple select values for input

    // dynamic placeholder active/not active
    $('.selectpicker').on('change.bs.select', function(el, callAjax){
        if ($(this).val() != "default" && $(this).val() != null && $(this).val() != []) {
            $(this).parent().parent().children('span.placeholder').addClass('active');
        } else {
            $(this).val('').selectpicker('refresh');
            $(this).parent().parent().children('span.placeholder').removeClass('active');
        };
        if (callAjax != false) {
            makeFormParameters();
        }
    });

    $("#price-from-input, #price-to-input").on('input', function(){
        if ($("#price-from-input").val() != "" || $("#price-to-input").val() != "") {
            $('.bootstrap-select').children('.btn.dropdown-toggle').addClass('highlight');
        } else {
            $('.bootstrap-select').children('.btn.dropdown-toggle').removeClass('highlight');
        }
    });

    $('input:not(.form-control)').on('focus', function(){
        $(this).parent().children('span.placeholder').addClass('active');
    }).on('focusout', function(el, callAjax){
        if ($(this).val() != "") {
            $(this).parent().children('span.placeholder').addClass('active');
        } else {
            $(this).parent().children('span.placeholder').removeClass('active');
        }
        if (callAjax != false) {
            makeFormParameters();
        };
    }).on('input', function(el){
        var value = $(this).val();
        if (typeof value == "undefined") {
            return;
        }
        if (value.toString().length > 0) {
            $(this).addClass("has-value");
        } else {
            $(this).removeClass("has-value");
        }
    }).trigger('focusout', false).trigger('input');
    // end dynamic placeholder active/not active

    // inputmask for prices
    $("input.inputmask").inputmask('numeric', {
        'alias': 'numeric',
        'groupSeparator': ' ',
        'rightAlign': false,
        'autoGroup': true,
        'autoUnmask': true,
        'removeMaskOnSubmit': true,
        'allowMinus': false
    });
    // end inputmask for prices

    // make form filter 
    function makeFormParameters() {
        var $form = $("form.search-form");
        formInputsActions($form, true);
        var data = $form.serialize();
        formInputsActions($form, false);
        if (data != oldRequest) {
            getAdCounts(data);
        };
        oldRequest = data;
    };
    // end make form filter 

    // form submit
    $("form.search-form").on('submit', function(e){
        $(this).attr('disabled', 'disabled');

        var formAction = $(this).data('action');

        var makeSlug = $('select#mark-select').find("option:selected").data("slug") || '',
            modelSlug = $('select#model-select').find("option:selected").data("slug") || '';

        formAction += '/' + makeSlug + ((makeSlug && modelSlug) ? '/' + modelSlug : '');
        $(this).prop('action', formAction);

        formInputsActions($(this), true, true);
        return true;
    });
    // end form submit

    // get ad counts 
    function getAdCounts(data) {
        if (xhrCount != null) {
            xhrCount.abort();
        }
        xhrCount = $.ajax({
            url: baseUrl + 'new/search' + "?" + data,
            method: 'GET',
            dataType: 'json'
        }).done(function(data) {
            $("form.search-form button#submit").text(countOfAds(data.data.count)).toggleClass("with-icon", data.data.count < 0).toggleClass("icon-arrow", data.data.count > 0).attr("disabled", (data.data.count > 0) ? "" : "true").removeAttr((data.data.count > 0) ? "disabled" : "");
        });
    };
    // end get ad counts

    // main page bottom slider
    if ($('.listing.bottom.with-slider').length) {
        if ($('.listing.bottom.with-slider').length) {
            var perPage = 5;
            if ($(window).width() <= 1440) {
                var windowWidth = $(window).width();
                $(".slider-holder").css("max-width", windowWidth - 100);
                perPage = (windowWidth < 1024) ? 4 : (windowWidth < 1000) ? 3 : (windowWidth < 800) ? 2 : 5;
            };
            var listingWidth = $('.listing.bottom').width() / perPage;
            $("ul.slider").find("li").outerWidth(listingWidth);
            $("ul.slider").width(listingWidth * $('ul.slider').children('li').length);
            $('.listing.bottom.with-slider').removeClass('loading');
        }
        var bottomScroll = new IScroll($('.listing.bottom')[0], {
            snap: true,
            click: true,
            momentum: true,
            scrollbars: false,
            scrollX: true,
            scrollY: false,
            mouseWheel: false,
            disableMouse: true
        });
        if ($(".page-content.slider").find(".indicator").length) {
            function bottomScrollIndicators() {
                if (bottomScroll.x >= 0) {
                    $(".indicator.left").addClass("deactive");
                } else {
                    $(".indicator.left").removeClass("deactive");
                }
                if (bottomScroll.x <= bottomScroll.maxScrollX) {
                    $(".indicator.right").addClass("deactive");
                } else {
                    $(".indicator.right").removeClass("deactive");
                }
            };
            bottomScrollIndicators();
            bottomScroll.on("scrollEnd", bottomScrollIndicators);
            $(".indicator").on("click", function (e) {
                e.preventDefault();
                if ($(this).hasClass('left')) {
                    bottomScroll.prev();
                } else if ($(this).hasClass('right')) {
                    bottomScroll.next();
                };
            });
        }
    };
    // end main page bottom slider

    // reset filter 
    $("a.reset-filter").on("click", function(e){
        e.preventDefault();
        $('form.search-form').find('select:not(.order-by)').val('').selectpicker('refresh').trigger('change', false);
        $('form.search-form').find('input').val('').trigger('input').trigger('focusout', false);
        makeFormParameters();
    });
    // end reset filter

    // order by submit
    $("select#order-by-select").on("change", function () {
        var sortBy = $(this).val(),
            sortByArr = sortBy.split(' ');

            orderby = sortByArr[0];
            sort = sortByArr[1];
            var sortTogether = orderby + " " + sort;

            var url = new URL(window.location.href);
            url.searchParams.set("sort_by", sortTogether);
            window.location = url;
    });
    // end order by submit

    // listing open dealer details
    $("body").on("click", "span.link", function () {
        window.open($(this).attr("href"), '_blank');
        return false;
    });
    // end listing open dealer details

    // sticky block
    if ($(".sticky").length) {
        var height = $(".sticky").parent().parent().innerHeight() - (($(".content.banner").length) ? $(".content.banner").outerHeight(true) : 0);
        var width = $(".sticky").parent().innerWidth();

        $(".sticky").parent().innerHeight(height);
        $(".sticky").innerWidth(width);

        window.addEventListener('scroll', function() {
            if (height != ($(".sticky").parent().parent().height() - (($(".content.banner").length) ? $(".content.banner").outerHeight(true) : 0))) {
                height = $(".sticky").parent().parent().innerHeight() - (($(".content.banner").length) ? $(".content.banner").outerHeight(true) : 0);
                $(".sticky").parent().height(height);
            };

            if (($(".sticky").parent().offset().top - 20 < $(document).scrollTop())) {
                $(".sticky").addClass("clr fixed").removeClass("static");
    
                if (($(".sticky").offset().top - $(".sticky").parent().offset().top + $(".sticky").outerHeight()) <= $(".sticky").parent().outerHeight()) {
                    $(".sticky").removeClass("static");
                } else {
                    $(".sticky").addClass("static").removeClass("clr fixed");
                };
            } else {
                $(".sticky").removeClass("clr fixed static");
            };
        }, { passive: true });
        $(window).trigger('scroll');
    };
    // end sticky block

    // fotorama fullscreen
    $('.fotorama').on('fotorama:fullscreenenter', function () {
        $("body.fullscreen").append($(".fotorama-label").clone().addClass('fotorama-fullscreen-label'));
    }).on('fotorama:fullscreenexit', function () {
        $(".fotorama-fullscreen-label").remove();
    });

    $("body").on("dblclick",".fotorama .fotorama__stage img", function(){
        if ($("body").hasClass("fulled")) {
            $('.fotorama').data('fotorama').cancelFullScreen();
        } else {
            $('.fotorama').data('fotorama').requestFullScreen();
        };
        $("body").toggleClass("fulled");
    });
    // end fotorama fullscreen
        

/* START: Branding Banner */
$("body").on("click", ".top-banner-improve.branding-1 a, .left-branding.branding-bg-1, .right-branding.branding-bg-1", function () {
    sendEvent("Banner Click", "Desktop - Branding New Auto - " + $(this).data('campaign'));
});
$("body").on("click",".top-banner-improve.branding-2 a, .left-branding.branding-bg-2, .right-branding.branding-bg-2", function () {
    sendEvent("Banner Click", "Desktop - Branding New Auto - " + $(this).data('campaign'));
});
$("body").on("click", ".top-banner-improve.branding-3 a, .left-branding.branding-bg-3, .right-branding.branding-bg-3", function () {
    sendEvent("Banner Click", "Desktop - Branding New Auto - " + $(this).data('campaign'));
});
$("body").on("click", ".top-banner-improve.branding-4 a, .left-branding.branding-bg-4, .right-branding.branding-bg-4", function () {
    sendEvent("Banner Click", "Desktop - Branding New Auto - " + $(this).data('campaign'));
});
$("body").on("click", ".top-banner-improve.branding-5 a, .left-branding.branding-bg-5, .right-branding.branding-bg-5", function () {
    sendEvent("Banner Click", "Desktop - Branding New Auto - " + $(this).data('campaign'));
});
/* END: Branding Banner */
});
// START:Details Page Forms
$("[data-toggle='modal']").each(function() {
    $($(this).data('target')).on("shown.bs.modal", function () {
        if ($(this).find('.modal-content').height() >= $(window).height()) {
            $(this).find('.modal-content').addClass("topped");
        } else {
            $(this).find('.modal-content').removeClass("topped");
        }
    })
});

var isMobile = false;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    $('.phone-prefix').selectpicker('mobile');
    isMobile = true;
}
else {
    $('.phone-prefix').selectpicker();
}

var ua = navigator.userAgent,
    isOldAndroid = false;
if ( ua.indexOf("Android") >= 0 ) {
    var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8));
    if (androidversion < 5) {
        isOldAndroid = true;
    }
}

$('.phone-prefix').on("loaded.bs.select", function() {
    var phoneInputField = $(this).closest('.phone-input-field').find('.phone-input');
    if (isOldAndroid) {
        phoneInputField.attr("type", "tel");
        phoneInputField.attr("maxlength", $(this).find('option:selected').data("mask").replace(/\D/g, "").length);
    } else {
        phoneInputField.inputmask($(this).find('option:selected').data("mask"));
    }
});
$('.phone-prefix').on("changed.bs.select", function() {
    var phoneInputField = $(this).closest('.phone-input-field').find('.phone-input');
    if (isOldAndroid) {
        phoneInputField.attr("type", "tel");
        phoneInputField.val("");
        phoneInputField.attr("maxlength", $(this).find('option:selected').data("mask").replace(/\D/g, "").length);
    } else {
        phoneInputField.inputmask($(this).find('option:selected').data("mask"));
        phoneInputField.val("");
    }
});

$(".add-comment-btn").on("click", function() {
    if ($(this).hasClass("hide-comment-btn")) {
        $(this).next("textarea").val("").addClass("hidden");
        $(this).text("Р”РѕР±Р°РІРёС‚СЊ РєРѕРјРјРµРЅС‚Р°СЂРёР№").removeClass("hide-comment-btn");
    } else {
        $(this).next("textarea").removeClass("hidden");
        $(this).text("РЈР±СЂР°С‚СЊ РєРѕРјРјРµРЅС‚Р°СЂРёР№").addClass("hide-comment-btn");
        $(this).next("textarea").focus();
    }

    if ($(this).closest('.modal-content').height() >= $(window).height()) {
        $(this).closest('.modal-content').addClass("topped");
    } else {
        $(this).closest('.modal-content').removeClass("topped");
    }
});

function resetFields(parent) {
    $(".add-comment-btn").text("Р”РѕР±Р°РІРёС‚СЊ РєРѕРјРјРµРЅС‚Р°СЂРёР№").removeClass("hide-comment-btn").next("textarea").val("").addClass("hidden");
    parent.find(".name-input").val("");
    parent.find(".phone-input").val("");
    if ($("#user-phone-value").val() != "") {
        parent.find(".phone-input").val($("#user-phone-value").val());
    }
    if (parent.find(".agreement-checkbox").length) {
        parent.find(".agreement-checkbox")[0].checked = false;
    }
    $(".error").removeClass("error");
}

resetFields($(".app-content.details-forms"));

var countLoadedSelects = 0;
$(".selectpicker").each(function() {
    $(this).on('loaded.bs.select', function () {
        countLoadedSelects++;
        if ($(".selectpicker").length == countLoadedSelects) {
            $(".left .app-loading").removeClass('app-loading');
        }
    })
});

$("#get-offer, #get-test-drive, #get-trade-in, #get-used-sale").on("shown.bs.modal", function () {
    resetFields($(this));
});

$('body').on('blur', '.bs-deselect-all', function (e) {
    $(this).parent().parent().parent().parent().removeClass('open');
});

function resetSelect(arrayOfFields) {
    arrayOfFields.forEach(function(item) {
        item.find('optgroup').remove();
        item.find("option").remove();
        item.attr("disabled", "disabled").val('').selectpicker('refresh');
        item.closest(".row").removeClass("error");
    });
}

function generateSelectField(fieldSelector, resultsObject, resetFieldsArray, searchFilterTrigger) {
    fieldSelector.empty().removeAttr("disabled");
    var selected = resultsObject.length == 1 ? "selected" : "";
    for (var i = 0; i < resultsObject.length; i++) {
        var addittionalText = "";
        if (fieldSelector.selector == "#generation-select-trade-in") {
            if (typeof resultsObject[i].begin != 'undefined' && resultsObject[i].begin != "" && resultsObject[i].begin != null) {
                addittionalText += ` (${resultsObject[i].begin} - `;
            }

            if (typeof resultsObject[i].end != 'undefined' && resultsObject[i].end != "" && resultsObject[i].end != null) {
                addittionalText += ` ${resultsObject[i].end})`;
            } else {
                addittionalText += ` ${new Date().getFullYear()})`;
            }
        }
        fieldSelector.append('<option '+selected+' value="' + resultsObject[i].id + '">' + resultsObject[i].name + addittionalText + '</option>');
    }

    fieldSelector.show().selectpicker('destroy').selectpicker().on('change.bs.select', function () {
        $(this).closest(".row").removeClass("error");
        if (resetFieldsArray != undefined) {
            resetSelect(resetFieldsArray);
        }
        if (searchFilterTrigger) {
            createSearchFilter();
        }
    });
}

$('#mark-select-trade-in, #mark-select-trade-in').selectpicker({
    noneResultsText: ""
})

var yearSelect = $('#year-select-trade-in'),
    generationSelect = $('#generation-select-trade-in'),
    bodySelect = $('#body-select-trade-in'),
    fuelSelect = $('#fuel-select-trade-in'),
    transmissionSelect = $('#transmission-select-trade-in'),
    gearBoxSelect = $('#gear-box-select-trade-in'),
    volumeBoxSelect = $('#volume-select-trade-in');

$("body").on("change.bs.select", '#mark-select-trade-in', function() {
    var result = $(this).val();
    var modelSelector = $('#model-select-trade-in');

    var inviteList = [];
    for (var i = 0; i < makeArr.length; i++) {
        if (result == makeArr[i]['id']) {
            for (var j = 0; j < makeArr[i].models.length; j++) {
                inviteList.push({
                    text: makeArr[i]['models'][j]['name'],
                    value: makeArr[i]['models'][j]['id'],
                    popular: makeArr[i]['models'][j]['is_popular']
                });
            }
        }
    }

    modelSelector.find('option').remove();
    modelSelector.find('optgroup').remove();
    modelSelector.selectpicker('refresh');

    if (result == null) {
        modelSelector.attr('disabled', 'disabled').val('').selectpicker('refresh');
        $(this).val('').selectpicker('refresh');
    } else {
        modelSelector.removeAttr('disabled').selectpicker('refresh');
    }

    if (isMobile) {
        modelSelector.append('<option value=""></option>');
    }
    modelSelector.append('<optgroup id="popular" label="'+ popular +'"></optgroup>','<optgroup id="all" label="'+ all +'"></optgroup>');
    for (var j = 0; j < inviteList.length; j++) {
        if (inviteList[j].popular == 1) {
            modelSelector.find("optgroup#popular").append('<option value="' + inviteList[j].value + '">' + inviteList[j].text + '</option>');
        }
        if (inviteList[j].value != 'default') {
            modelSelector.find("optgroup#all").append('<option value="' + inviteList[j].value + '">' + inviteList[j].text + '</option>');
        }
    };
    modelSelector.selectpicker('refresh');

    $(this).closest(".row").removeClass("error");
    modelSelector.closest(".row").removeClass("error");

    resetSelect([yearSelect, generationSelect, bodySelect, fuelSelect, transmissionSelect, gearBoxSelect, volumeBoxSelect]);
});

$("body").on("change.bs.select", '#model-select-trade-in', function() {

    $(this).closest(".row").removeClass("error");

    resetSelect([yearSelect, generationSelect, bodySelect, fuelSelect, transmissionSelect, gearBoxSelect, volumeBoxSelect]);

    createSearchFilter();
});

function createSearchFilter() {
    // model
    var selectedModel = isMobile ? $('#model-select-trade-in').val() : $('#model-select-trade-in').val()[0],
        modelId;

    if ($.isNumeric(selectedModel)) {
        modelId = selectedModel;
    }

    // year
    var selectedYear = yearSelect.val(),
        year;
    if ($.isNumeric(selectedYear)) {
        year = selectedYear;
    }

    // generation
    var selectedGeneration = generationSelect.val(),
        generationId;
    if ($.isNumeric(selectedGeneration)) {
        generationId = selectedGeneration;
    }

    // body
    var selectedBody = bodySelect.val(),
        bodyId;
    if ($.isNumeric(selectedBody)) {
        bodyId = selectedBody;
    }

    // fuel
    var selectedFuel = fuelSelect.val(),
        fuelId;
    if ($.isNumeric(selectedFuel)) {
        fuelId = selectedFuel;
    }

    // transmission
    var selectedTransmission = transmissionSelect.val(),
        transmissionId;
    if ($.isNumeric(selectedTransmission)) {
        transmissionId = selectedTransmission;
    }

    // gear box
    var selectedGearBox = gearBoxSelect.val(),
        gearBoxId;
    if ($.isNumeric(selectedGearBox)) {
        gearBoxId = selectedGearBox;
    }

    // generate url
    var url = dependentUrl;

    if (modelId) {
        url = url + '?model_id=' + modelId;

        if (year) {
            url = url + '&year=' + year;

            if (bodyId) {
                url = url + '&body_id=' + bodyId;

                if (generationId) {
                    url = url + '&generation_id=' + generationId;

                    if (fuelId) {
                        url = url + '&fuel_id=' + fuelId;

                        if (transmissionId) {
                            url = url + '&transmission_id=' + transmissionId;

                            if (gearBoxId) {
                                url = url + '&gear_box_id=' + gearBoxId;
                            }
                        }
                    }
                }
            }
        }

        loadDependentFields(url);
    }
}

function loadDependentFields(url) {
    $.ajax({
        url: url,
        async: false,
        dataType: 'json'
    }).done(function(results) {
        processDependentFields(results);
    });
}

function processDependentFields(results) {
    if (results.hasOwnProperty('data')) {

        // year
        if (results.data != null) {
            if (results.data.hasOwnProperty('year')) {
                if (results.data.year.length) {
                    yearSelect.empty().removeAttr("disabled");
                    var selected = results.data.year.length == 1 ? "selected" : "";
                    for (var i = 0; i < results.data.year.length; i++) {
                        yearSelect.append('<option '+selected+' value="' + results.data.year[i] + '">' + results.data.year[i] + '</option>');
                    }

                    if (selected) {
                        yearSelect.val(results.data.year[0]).selectpicker('refresh');
                        createSearchFilter();
                    } else {
                        yearSelect.show().selectpicker('destroy').selectpicker().on('change.bs.select', function () {

                            $(this).closest(".row").removeClass("error");

                            resetSelect([generationSelect, bodySelect, fuelSelect, transmissionSelect, gearBoxSelect, volumeBoxSelect]);

                            createSearchFilter();
                        });
                    }

                }
            }
        }

        // body
        if (results.data != null) {
            if (results.data.hasOwnProperty('body')) {
                if (results.data.body.length) {
                    generateSelectField(bodySelect, results.data.body, [generationSelect, fuelSelect, transmissionSelect, gearBoxSelect, volumeBoxSelect], true);
                }
            }
        }

        // generation
        if (results.data != null) {
            if (results.data.hasOwnProperty('generation')) {
                if (results.data.generation.length) {
                    generateSelectField(generationSelect, results.data.generation, [fuelSelect, transmissionSelect, gearBoxSelect, volumeBoxSelect], true);
                }
            }
        }

        // fuel
        if (results.data != null) {
            if (results.data.hasOwnProperty('fuel')) {
                if (results.data.fuel.length) {
                    generateSelectField(fuelSelect, results.data.fuel, [transmissionSelect, gearBoxSelect, volumeBoxSelect], true);
                }
            }
        }

        // transmission
        if (results.data != null) {
            if (results.data.hasOwnProperty('transmission')) {
                if (results.data.transmission.length) {
                    generateSelectField(transmissionSelect, results.data.transmission, [gearBoxSelect, volumeBoxSelect], true);
                }
            }
        }

        // gear box
        if (results.data != null) {
            if (results.data.hasOwnProperty('gear_box')) {
                if (results.data.gear_box.length) {
                    generateSelectField(gearBoxSelect, results.data.gear_box, [volumeBoxSelect], true);
                }
            }
        }

        // modification
        if (results.data != null) {
            if (results.data.hasOwnProperty('modification')) {
                if (results.data.modification.length) {
                    generateSelectField(volumeBoxSelect, results.data.modification, undefined, false);
                }
            }
        }
    }
}

$("#mileage-trade-in").inputmask('numeric', {
    'alias': 'numeric',
    'groupSeparator': ' ',
    'rightAlign': false,
    'autoGroup': true,
    'autoUnmask': true,
    'removeMaskOnSubmit': true,
    'allowMinus': false
});

var hideAlert;
var timeToHideAlert = 12000;

function hideAlertFunction() {
    $(".new-design-alert, .flash-alert").fadeOut(function() {
        $(".new-design-alert .close, .flash-alert .close").trigger("click");
    });
}

setTimeout(function() {
    hideAlertFunction();
}, timeToHideAlert);

function showFlashMessageDealers(message, type, icon, container) {
    type = type || 'success';
    icon = icon || '';

    var markup = '<div class="flash-alert alert alert-' + type + ' alert-dismissible" role="alert">';
    markup += '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
    markup += '<span class="glyphicon glyphicon-' + icon + '" aria-hidden="true"></span>' + message;
    markup += '</div>';

    container.append($(markup));
    clearInterval(hideAlert);
    hideAlert = setInterval(hideAlertFunction, timeToHideAlert);
}

$(".row input[type='checkbox']").on("change", function() {
    $(this).closest(".row").removeClass("error");
});

$(".row input[type='text']").on("keyup", function() {
    $(this).closest(".row").removeClass("error");
    $(this).closest(".col-md-6").removeClass("error");
});

$("#trade_in-form").on("submit", function(e) {
    e.preventDefault();

    var $form = $(this);
    var $btn = $("#submit-trade_in", $form);

    if ($btn.hasClass("spinner")) {
        return false;
    }

    $(".error", $form).removeClass("error");

    if (trade_in_captha == "") {
        $("#recaptcha_node_trade_in").addClass("error");
    }

    if (!$(".agreement-checkbox", $form).is(":checked")) {
        $(".agreement-checkbox", $form).closest(".row").addClass("error");
    }

    if ($.trim($(".name-input", $form).val()) == "") {
        $(".name-input", $form).closest(".col-md-6").addClass("error");
    }

    if ($(".email-input", $form).length) {
        if ($.trim($(".email-input", $form).val()) == "") {
            $(".email-input", $form).closest(".col-md-6").addClass("error");
        }
    }
    else {
        if ($(".phone-input", $form).inputmask('unmaskedvalue') == null || !$(".phone-input", $form).inputmask('isComplete') ) {
            $(".phone-input", $form).closest(".col-md-6").addClass("error");
        }
    }

    $(".row select", $form).each(function() {
        if (!$(this).hasClass("phone-prefix")) {
            if ($(this).val() == null || $(this).val() == "") {
                $(this).closest(".row").addClass("error");
            }
        }
    });

    if ($(".error", $form).length == 0) {
        $btn.addClass("spinner").attr("disabled", "disabled");

        var data = {
            form: $("input[name=form_type]", $form).val(),
            dealer: $("input[name=dealer]", $form).val(),
            slug: $("input[name=slug]", $form).val(),
            phone: $(".phone-input", $form).length ? $("select.phone-prefix", $form).val() + $(".phone-input", $form).inputmask('unmaskedvalue') : '',
            email: $("input[name=slug]", $form).length ? $("input[name=email]", $form).val() : '',
            first_name: $(".name-input", $form).val(),
            comment: $(".user-comment", $form).val(),
            user_id: $("input[name=user_id]", $form).length ? $("input[name=user_id]", $form).val() : '',
            trade_in_make: $("#mark-select-trade-in").length ? $("#mark-select-trade-in").val()[0] : '',
            trade_in_model: $("#model-select-trade-in").length ? $("#model-select-trade-in").val()[0] : '',
            trade_in_year: $("#year-select-trade-in").length ? $("#year-select-trade-in").val() : '',
            trade_in_body: $("#body-select-trade-in").length ? $("#body-select-trade-in").val() : '',
            trade_in_generation: $("#generation-select-trade-in").length ? $("#generation-select-trade-in").val() : '',
            trade_in_mileage: $("#mileage-trade-in").length ? $("#mileage-trade-in").val() : '',
            "g-recaptcha-response" : trade_in_captha
        };
        $.ajax({
            url: baseUrl + "leads/send-official-dealer",
            method: 'POST',
            data: data
        }).done(function (result) {
            // console.log(result);
            if (result.type == "success") {
                if ($(".app-content").length) {
                    $(".app-content .modal-dialog").hide();
                    $(".app-content").append(`<div class="success-message">Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°. Р’ Р±Р»РёР¶Р°Р№С€РµРµ РІСЂРµРјСЏ РІР°Рј РїРµСЂРµР·РІРѕРЅСЏС‚ РЅР° СѓРєР°Р·Р°РЅРЅС‹Р№ РІР°РјРё РЅРѕРјРµСЂ.</div>`);
                } else {
                    var url = new URL(window.location.href);
                    url.searchParams.set("form_submitted", 1);
                    window.location = url;
                }
            } else {
                showFlashMessageDealers(result.message, 'danger', '', $('.feedback-container', $form));
                $btn.removeClass("spinner").removeAttr("disabled");
            }
        });
    }

    return false;
});

$("#offer-form").on("submit", function(e) {
    e.preventDefault();

    var $form = $(this);
    var $btn = $("#submit-offer", $form);

    if ($btn.hasClass("spinner")) {
        return false;
    }

    $(".error", $form).removeClass("error");

    if (offer_captha == "") {
        $("#recaptcha_node_offer").addClass("error");
    }

    if (!$(".agreement-checkbox", $form).is(":checked")) {
        $(".agreement-checkbox", $form).closest(".row").addClass("error");
    }

    if ($.trim($(".name-input", $form).val()) == "") {
        $(".name-input", $form).closest(".col-md-6").addClass("error");
    }

    if ($(".phone-input", $form).inputmask('unmaskedvalue') == null || !$(".phone-input", $form).inputmask('isComplete') ) {
        $(".phone-input", $form).closest(".col-md-6").addClass("error");
    }

    if ($(".error", $form).length == 0) {
        $btn.addClass("spinner").attr("disabled", "disabled");

        var data = {
            form: $("input[name=form_type]", $form).val(),
            dealer: $("input[name=dealer]", $form).val(),
            slug: $("input[name=slug]", $form).val(),
            phone: $("select.phone-prefix", $form).val() + $(".phone-input", $form).inputmask('unmaskedvalue'),
            first_name: $(".name-input", $form).val(),
            comment: $(".user-comment", $form).val(),
            user_id: $("input[name=user_id]", $form).length ? $("input[name=user_id]", $form).val() : '',
            "g-recaptcha-response" : offer_captha
        };
        $.ajax({
            url: baseUrl + "leads/send-official-dealer",
            method: 'POST',
            data: data
        }).done(function (result) {
            // console.log(result);
            if (result.type == "success") {
                if ($(".app-content").length) {
                    $(".app-content .modal-dialog").hide();
                    $(".app-content").append(`<div class="success-message">Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°. Р’ Р±Р»РёР¶Р°Р№С€РµРµ РІСЂРµРјСЏ РІР°Рј РїРµСЂРµР·РІРѕРЅСЏС‚ РЅР° СѓРєР°Р·Р°РЅРЅС‹Р№ РІР°РјРё РЅРѕРјРµСЂ.</div>`);
                } else {
                    var url = new URL(window.location.href);
                    url.searchParams.set("form_submitted", 1);
                    window.location = url;
                }
            } else {
                showFlashMessageDealers(result.message, 'danger', '', $('.feedback-container', $form));
                $btn.removeClass("spinner").removeAttr("disabled");
            }
        });
    }

    return false;
});

$("#used_sale-form").on("submit", function(e) {
    e.preventDefault();

    var $form = $(this);
    var $btn = $("#submit-used_sale", $form);

    if ($btn.hasClass("spinner")) {
        return false;
    }

    $(".error", $form).removeClass("error");

    if (used_sale_captha == "") {
        $("#recaptcha_node_used_sale").addClass("error");
    }

    if (!$(".agreement-checkbox", $form).is(":checked")) {
        $(".agreement-checkbox", $form).closest(".row").addClass("error");
    }

    if ($.trim($(".name-input", $form).val()) == "") {
        $(".name-input", $form).closest(".col-md-6").addClass("error");
    }

    if ($(".phone-input", $form).inputmask('unmaskedvalue') == null || !$(".phone-input", $form).inputmask('isComplete') ) {
        $(".phone-input", $form).closest(".col-md-6").addClass("error");
    }

    if ($(".error", $form).length == 0) {
        $btn.addClass("spinner").attr("disabled", "disabled");

        var data = {
            form: $("input[name=form_type]", $form).val(),
            dealer: $("input[name=dealer]", $form).val(),
            slug: $("input[name=slug]", $form).val(),
            phone: $("select.phone-prefix", $form).val() + $(".phone-input", $form).inputmask('unmaskedvalue'),
            first_name: $(".name-input", $form).val(),
            comment: $(".user-comment", $form).val(),
            user_id: $("input[name=user_id]", $form).length ? $("input[name=user_id]", $form).val() : '',
            "g-recaptcha-response" : used_sale_captha
        };
        $.ajax({
            url: baseUrl + "leads/send-official-dealer",
            method: 'POST',
            data: data
        }).done(function (result) {
            // console.log(result);
            if (result.type == "success") {
                if ($(".app-content").length) {
                    $(".app-content .modal-dialog").hide();
                    $(".app-content").append(`<div class="success-message">Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°. Р’ Р±Р»РёР¶Р°Р№С€РµРµ РІСЂРµРјСЏ РІР°Рј РїРµСЂРµР·РІРѕРЅСЏС‚ РЅР° СѓРєР°Р·Р°РЅРЅС‹Р№ РІР°РјРё РЅРѕРјРµСЂ.</div>`);
                } else {
                    var url = new URL(window.location.href);
                    url.searchParams.set("form_submitted", 1);
                    window.location = url;
                }
            } else {
                showFlashMessageDealers(result.message, 'danger', '', $('.feedback-container', $form));
                $btn.removeClass("spinner").removeAttr("disabled");
            }
        });
    }

    return false;
});

$("#test_drive-form").on("submit", function(e) {
    e.preventDefault();

    var $form = $(this);
    var $btn = $("#submit-test_drive", $form);

    if ($btn.hasClass("spinner")) {
        return false;
    }

    $(".error", $form).removeClass("error");

    if (test_drive_captha == "") {
        $("#recaptcha_node_test_drive").addClass("error");
    }

    if (!$(".agreement-checkbox", $form).is(":checked")) {
        $(".agreement-checkbox", $form).closest(".row").addClass("error");
    }

    if ($.trim($(".name-input", $form).val()) == "") {
        $(".name-input", $form).closest(".col-md-6").addClass("error");
    }

    if ($(".phone-input", $form).inputmask('unmaskedvalue') == null || !$(".phone-input", $form).inputmask('isComplete') ) {
        $(".phone-input", $form).closest(".col-md-6").addClass("error");
    }

    if ($(".error", $form).length == 0) {
        $btn.addClass("spinner").attr("disabled", "disabled");

        var data = {
            form: $("input[name=form_type]", $form).val(),
            dealer: $("input[name=dealer]", $form).val(),
            slug: $("input[name=slug]", $form).val(),
            phone: $("select.phone-prefix", $form).val() + $(".phone-input", $form).inputmask('unmaskedvalue'),
            first_name: $(".name-input", $form).val(),
            comment: $(".user-comment", $form).val(),
            test_drive_date: $("#date").val(),
            test_drive_time: $("#time").val(),
            user_id: $("input[name=user_id]", $form).length ? $("input[name=user_id]", $form).val() : '',
            "g-recaptcha-response" : test_drive_captha
        };
        $.ajax({
            url: baseUrl + "leads/send-official-dealer",
            method: 'POST',
            data: data
        }).done(function (result) {
            // console.log(result);
            if (result.type == "success") {
                if ($(".app-content").length) {
                    $(".app-content .modal-dialog").hide();
                    $(".app-content").append(`<div class="success-message">Р—Р°СЏРІРєР° РѕС‚РїСЂР°РІР»РµРЅР°. Р’ Р±Р»РёР¶Р°Р№С€РµРµ РІСЂРµРјСЏ РІР°Рј РїРµСЂРµР·РІРѕРЅСЏС‚ РЅР° СѓРєР°Р·Р°РЅРЅС‹Р№ РІР°РјРё РЅРѕРјРµСЂ.</div>`);
                } else {
                    var url = new URL(window.location.href);
                    url.searchParams.set("form_submitted", 1);
                    window.location = url;
                }
            } else {
                showFlashMessageDealers(result.message, 'danger', '', $('.feedback-container', $form));
                $btn.removeClass("spinner").removeAttr("disabled");
            }
        });
    }

    return false;
});

if ($('.date-picker').length) {
    $.datepicker.regional['ru'] = {
        closeText: "Р—Р°РєСЂС‹С‚СЊ",
        prevText: "&#x3C;РџСЂРµРґ",
        nextText: "РЎР»РµРґ&#x3E;",
        currentText: "РЎРµРіРѕРґРЅСЏ",
        monthNames: [ "РЇРЅРІР°СЂСЊ", "Р¤РµРІСЂР°Р»СЊ", "РњР°СЂС‚", "РђРїСЂРµР»СЊ", "РњР°Р№", "РСЋРЅСЊ",
            "РСЋР»СЊ", "РђРІРіСѓСЃС‚", "РЎРµРЅС‚СЏР±СЂСЊ", "РћРєС‚СЏР±СЂСЊ", "РќРѕСЏР±СЂСЊ", "Р”РµРєР°Р±СЂСЊ" ],
        monthNamesShort: [ "РЇРЅРІ", "Р¤РµРІ", "РњР°СЂ", "РђРїСЂ", "РњР°Р№", "РСЋРЅ",
            "РСЋР»", "РђРІРі", "РЎРµРЅ", "РћРєС‚", "РќРѕСЏ", "Р”РµРє" ],
        dayNames: [ "РІРѕСЃРєСЂРµСЃРµРЅСЊРµ", "РїРѕРЅРµРґРµР»СЊРЅРёРє", "РІС‚РѕСЂРЅРёРє", "СЃСЂРµРґР°", "С‡РµС‚РІРµСЂРі", "РїСЏС‚РЅРёС†Р°", "СЃСѓР±Р±РѕС‚Р°" ],
        dayNamesShort: [ "РІСЃРє", "РїРЅРґ", "РІС‚СЂ", "СЃСЂРґ", "С‡С‚РІ", "РїС‚РЅ", "СЃР±С‚" ],
        dayNamesMin: [ "Р’СЃ", "РџРЅ", "Р’С‚", "РЎСЂ", "Р§С‚", "РџС‚", "РЎР±" ],
        weekHeader: "РќРµРґ",
        dateFormat: "dd.mm.yy",
        firstDay: 1,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: ""
    };

    $.datepicker.setDefaults($.datepicker.regional['ru']);

    $('.date-picker').datepicker({
        dateFormat: 'dd-mm-yy',
        minDate: 0,
        maxDate: "+3M",
        beforeShow:function(textbox, instance){
            $('.date-col').append($('#ui-datepicker-div'));
        }
    }).attr('readonly','readonly');

    // $(".modal-dialog, .modal").on("scroll", function () {
    //     $('#ui-datepicker-div').hide();
    // });
}
// END:Details Page Forms