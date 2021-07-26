// Put all onload AJAX calls here, and event listeners
function changeWPCount(add) {
    if (add == 1) {
        var waypointRow = `<div class="form-group row" id="newwaypoint">
        <div class="col-sm-4">
            <input type="text" id="lat" class="form-control"  placeholder="latitude">
        </div>
        <div class="col-sm-4">
            <input type="text" id="lon" class="form-control"  placeholder="longitude">
        </div>
         </div>`
        $("#newwaypoints").append(waypointRow)
    } else {
        $("#newwaypoint")[$("#newwaypoint").length - 1].remove()
    }
}
function distance(lt1, ln1, lt2, ln2, unit) {
    if ((lt1 == lt2) && (ln1 == ln2)) {
        return 0;
    }
    else {
        var theta = ln1 - ln2;
        var radlt1 = Math.PI * lt1 / 180;
        var radlt2 = Math.PI * lt2 / 180;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlt1) * Math.sin(radlt2) + Math.cos(radlt1) * Math.cos(radlt2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit == "m") { dist = dist * 1.609344 * 1000 }
        return dist;
    }
}
function store_all_files(log_div) {
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: `/storeallfiles`,   //The server endpoint we are connecting to
        data: {},
        cache: false,
        success: function (data) {
            $('#display-db-status').trigger('click');
        },
        error: function (error) {
            $(`#${log_div}`).empty();
            $(`#${log_div}`).empty();
            $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">${error.responseText}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`);
        }
    });
}

function displayDBStatus(log_div) {
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: `/dbstatus`,   //The server endpoint we are connecting to
        data: {},
        cache: false,
        success: function (data) {
            $(`#${log_div}`).empty();
            const { flag, msg, file_count, route_count, point_count } = data;
            if (flag === true) {
                $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">
                Database has ${file_count} files, ${route_count} routes and ${point_count} points.
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
                </div>`);
            } else {
                $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">
                ${msg}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
              </div>`);
            }
        },
        error: function (error) {
            $(`#${log_div}`).empty();
            $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">${error.responseText}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`);
        }
    });
}
function clear_all_data(log_div) {
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: `/cleardb`,        //The server endpoint we are connecting to
        data: {},
        success: function (data) {
            $(`#${log_div}`).empty();
            const { flag, msg } = data;
            $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">${msg}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`);
            $('#display-db-status').trigger('click');
        },
        error: function (error) {
            $(`#${log_div}`).empty();
            $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">${error.responseText}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`);
        }
    });
}

function updatequery1table(table, log_div){
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: `/query1`,   //The server endpoint we are connecting to
        data: {},
        success: function (data) {
            table.clear();
            let rows = data['records'];
            rows.forEach(row => {
                table.row.add([row.route_id,row.route_name,row.route_len])
            });
            table.draw();
        },
        error: function (error) {
            $(`#${log_div}`).empty();
            $(`#${log_div}`).empty();
            $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">${error.responseText}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`);
        }
    });   
}
function updatequery5table(table, log_div){
    let file_name = $('#query5-input-file').val()
    if (file_name == 'Select'){
        alert("Select a file..")
        return;
    }
    let order = $("#query5-input-order").val()
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: `/query5`,   //The server endpoint we are connecting to
        data: {"N":$("#N").val(),file_name,order},
        cache: false,
        success: function (data) {
            table.clear();
            let rows = data['records'];
            rows.forEach(row => {
                table.row.add([row.route_id, row.route_name, row.route_len, row.file_name])
            });
            table.draw();
        },
        error: function (error) {
            $(`#${log_div}`).empty();
            $(`#${log_div}`).empty();
            $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">${error.responseText}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`);
        }
    });   
}

function updatequery3table(table, log_div){
    let route_name = $('#query3-input-route').val()
    if (!route_name){
        alert("Select a route")
        return;
    }
    
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: `/query3`,   //The server endpoint we are connecting to
        data: {"route_id":route_name},
        cache: false,
        success: function (data) {
            table.clear();
            let rows = data['records'];
            rows.forEach(row => {
                table.row.add([row.point_index, row.point_id, row.point_name, row.latitude, row.longitude])
            });
            table.draw();
        },
        error: function (error) {
            $(`#${log_div}`).empty();
            $(`#${log_div}`).empty();
            $(`#${log_div}`).html(`<div class="alert alert-success" role="alert">${error.responseText}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`);
        }
    });   
}
$(document).ready(function () {

    var filesData = [];
    var query1_table = $(`#query1-table`).DataTable();
    var query2_table = $(`#query2-table`).DataTable();
    var query3_table = $(`#query3-table`).DataTable();
    var query4_table = $(`#query4-table`).DataTable();
    var query5_table = $(`#query5-table`).DataTable();
    // On page-load AJAX Example
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: '/getuploads',   //The server endpoint we are connecting to
        success: function (data) {
            filesData = data;
            $('#fileLog-table').append('<tbody></tbody>');

            $.each(data, function (key, file) {
                $('#fileLog-table > tbody').append(`<tr>
                <td><a href="/uploads/${key}" download="${key}">${key}</a></td>
                  <td>${file.gpx['$'].version ? file.gpx['$'].version : '-'}</td>
                  <td>${file.gpx['$'].creator ? file.gpx['$'].creator : '-'}</td>
                  <td>${file.gpx['wpt'] ? file.gpx['wpt'].length : '-'}</td>
                  <td>${file.gpx['rte'] ? file.gpx['rte'].length : '-'}</td>
                  <td>${file.gpx['trk'] ? file.gpx['trk'].length : '-'}</td>
                </tr>`);
                //Use the Option() constructor to create a new HTMLOptionElement.
                var option = new Option(key, key);
                //Convert the HTMLOptionElement into a JQuery object that can be used with the append method.
                $(option).html(key);
                //Append the option to our Select element.
                $("#gpx-menu").append(option);
                var option = new Option(key, key);
                //Convert the HTMLOptionElement into a JQuery object that can be used with the append method.
                $(option).html(key);
                $("#filesForRename").append(option);

                var option = new Option(key, key);
                //Convert the HTMLOptionElement into a JQuery object that can be used with the append method.
                $(option).html(key);
                $("#route-files").append(option);


                var option = new Option(key, key);
                //Convert the HTMLOptionElement into a JQuery object that can be used with the append method.
                $(option).html(key);
                $("#query2-input-file").append(option);

                var option = new Option(key, key);
                //Convert the HTMLOptionElement into a JQuery object that can be used with the append method.
                $(option).html(key);
                $("#query4-input-file").append(option);

                var option = new Option(key, key);
                //Convert the HTMLOptionElement into a JQuery object that can be used with the append method.
                $(option).html(key);
                $("#query5-input-file").append(option);

            });

            //Change the text of the default "loading" option.
            $('#loading').text('Select File');
        },
        fail: function (error) {
            // Non-200 return, do something with error
            $('#blah').html("On page load, received error from server");
            console.log(error);
        }
    });
    $("#query5").click(function(){
        updatequery5table(query5_table,"query5-msg");    
    });
    $("#query3-fetch").click(function(){
        updatequery3table(query3_table,"query3-msg");    
    });
    $('#query2-input-file').on('change', function () {
        let file_name = this.value;
        if(file_name == 'Select'){
            return;
        }
        $.ajax({
            type: 'get',            //Request type
            dataType: 'json',       //Data type - we will use JSON for almost everything 
            url: '/query2',
            data: {file_name},
            cache: false,
            success: function (data) {
                query2_table.clear();
                let rows = data['records'];
                rows.forEach(row => {
                    query2_table.row.add([row.route_id,row.route_name, row.route_len])
                });
                query2_table.draw();

            },
            fail: function (error) {

            }
        });
    });
    $('#query4-input-file').on('change', function () {
        let file_name = this.value;
        if(file_name == 'Select'){
            return;
        }
        $.ajax({
            type: 'get',            //Request type
            dataType: 'json',       //Data type - we will use JSON for almost everything 
            url: '/query4',
            cache: false,
            data: {file_name},
            success: function (data) {
                query4_table.clear();
                let rows = data['records'];
                for (let index = 0; index < rows.length; index++) {
                    const row = rows[index];
                    let route_name = "" 
                    if (row.route_name == "null" || row.route_name == "undefined" ){
                        route_name += `Unnamed route - ${row.route_id}`
                    }else{
                        route_name = row.route_name;
                    }
                    let point_name = ""
                    if (row.point_name == "null" || row.point_name == "undefined" ){
                        point_name += `Unnamed point - ${row.point_index}`
                    }else{
                        point_name = row.point_name;
                    }
                    query4_table.row.add([row.point_index,row.point_id, point_name,row.latitude, row.longitude, route_name])
                }
                query4_table.draw();
            },
            fail: function (error) {

            }
        });
    });
    
    $("#query3").click(function(){
        $("#query3-input-route").empty();
        $.ajax({
            type: 'get',            //Request type
            dataType: 'json',       //Data type - we will use JSON for almost everything 
            url: '/query3-routes',
            cache: false,
            success: function (data) {
                let rows = data['records'];
                rows.forEach(key => {
                    //Use the Option() constructor to create a new HTMLOptionElement.
                    var option = new Option(key.route_unique_id, key.route_id);
                    //Convert the HTMLOptionElement into a JQuery object that can be used with the append method.
                    $(option).html(key.route_unique_id);
                    //Append the option to our Select element.
                    $("#query3-input-route").append(option);
                });
            },
            fail: function (error) {

            }
        });
        
    });

    $("#query1").click(function(){
        updatequery1table(query1_table,"query1-msg");    
    });

    $('#gpx-menu').on('change', function () {
        $('#gpx-table > tbody').html('');
        $.ajax({
            type: 'get',            //Request type
            dataType: 'json',       //Data type - we will use JSON for almost everything 
            url: '/uploads/' + this.value,   //The server endpoint we are connecting to
            success: function (data) {
                var index = 0;
                $.each(data.gpx.rte, function (key, route) {
                    let dist = 0
                    for (let i = 0; i < route.rtept.length - 1; i++) {
                        const a = route.rtept[i];
                        dist = dist + distance(
                            a['$']['lat'],
                            a['$']['lon'],
                            route.rtept[i + 1]['$']['lat'],
                            route.rtept[i + 1]['$']['lon'],
                            'm')
                    }
                    $('#gpx-table > tbody').append(`<tr>
                    <th>Route ${index = index + 1}</th>
                      <th>${route.name}</th>
                      <th>${route.rtept.length}</th>
                      <th>${dist.toFixed(0) + "m"}</th>
                      <th>${(route.rtept[0].lat &&
                            (route.rtept[0].lat == route.rtept[route.rtept.length - 1].lat && route.rtept[0].lon == route.rtept[route.rtept.length - 1].lon)) ? 'TRUE' : 'FALSE'}</th>
                    </tr>`);
                });
                index = 0;
                $.each(data.gpx.trk, function (key, track) {
                    let dist = 0
                    for (let i = 0; i < track.trkseg[0]['trkpt'].length; i++) {
                        const a = track.trkseg[0]['trkpt'][i];
                        if (i != track.trkseg[0]['trkpt'].length - 1) {
                            dist = dist + distance(a['$']['lat'], a['$']['lon'], track.trkseg[0]['trkpt'][i + 1]['$']['lat'], track.trkseg[0]['trkpt'][i + 1]['$']['lon'], 'm')
                        }
                    }
                    $('#gpx-table > tbody').append(`<tr>
                    <th>Track ${index = index + 1}</th>
                      <th>${track.name}</th>
                      <th>${track.trkseg[0]['trkpt'].length}</th>
                      <th>${dist.toFixed(0) + "m"}</th>
                      <th>${(track.trkseg[0]['trkpt'][0].lat == track.trkseg[0]['trkpt'][track.trkseg[0]['trkpt'].length - 1].lat && track.trkseg[0]['trkpt'][0].lon == track.trkseg[0]['trkpt'][track.trkseg[0]['trkpt'].length - 1].lon) ? 'TRUE' : 'FALSE'}</th>
                    </tr>`);
                });
            },
            fail: function (error) {
                // Non-200 return, do something with error
                $('#blah').html("On page load, received error from server");
                console.log(error);
            }
        });

    });
    // Event listener form example , we can use this instead explicitly listening for events
    // No redirects if possible
    $("#uploadForm").submit(function (e) {
        e.preventDefault();
        var formData = new FormData(this);
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            success: function (data) {
                alert(JSON.stringify(data))
                window.location.reload();
            },
            cache: false,
            contentType: false,
            processData: false
        });

    });

    $("#gpx-new").submit(function (e) {
        e.preventDefault();
        var formData = new FormData(this);
        $.ajax({
            url: '/createGPXfile',
            type: 'POST',
            data: formData,
            success: function (data) {
                alert(data)
                window.location.reload();
            },
            cache: false,
            contentType: false,
            processData: false
        });

    });

    $("#renameForm").submit(function (e) {
        e.preventDefault();
        var formData = new FormData(this);
        $.ajax({
            url: '/renamefile',
            type: 'POST',
            data: formData,
            success: function (data) {
                alert(data);
                window.location.reload();
            },
            cache: false,
            contentType: false,
            processData: false
        });
    });
    $("#route-form").submit(function (e) {
        e.preventDefault();

        let payload = {
            filename: this[0].value,
            routename: this[1].value,
            waypoints: []
        }
        for (let i = 6; i < this.length - 1; i = i + 2) {
            const lat = this[i].value;
            const lon = this[i + 1].value;
            var latlng = { lat, lon }
            payload.waypoints.push(latlng);
        }
        // var formData = new FormData(this);
        const formData = new FormData(this);
        formData.append('routename', payload.routename)
        formData.append('waypoints', JSON.stringify(payload.waypoints))
        $.ajax({
            url: '/addRoute',
            type: 'POST',
            data: formData,
            success: function (data) {
                alert(data);
                window.location.reload();
            },
            cache: false,
            contentType: false,
            processData: false
        });
    });

    $(`#store-all-files`).click(function(){
        store_all_files("store-all-files-log");
    });

    $('#display-db-status').click(function () {
        displayDBStatus("db-status-log");
    });

    $('#clear-all-data').click(function () {
        clear_all_data('clear-db-log');
    });



    function convertJsonToFormData(data) {
        const formData = new FormData()
        const entries = Object.entries(data) // returns array of object property as [key, value]
        // https://medium.com/front-end-weekly/3-things-you-didnt-know-about-the-foreach-loop-in-js-ff02cec465b1

        for (let i = 0; i < entries.length; i++) {
            // don't try to be smart by replacing it with entries.each, it has drawbacks
            const arKey = entries[i][0]
            let arVal = entries[i][1]
            if (typeof arVal === 'boolean') {
                arVal = arVal === true ? 1 : 0
            }
            if (Array.isArray(arVal)) {
                console.log('displaying arKey')
                console.log(arKey)
                console.log('displaying arval')
                console.log(arVal)

                if (arVal[0] instanceof Object) {
                    for (let j = 0; j < arVal.length; j++) {
                        if (arVal[j] instanceof Object) {
                            // if first element is not file, we know its not files array
                            for (const prop in arVal[j]) {
                                if (Object.prototype.hasOwnProperty.call(arVal[j], prop)) {
                                    // do stuff
                                    if (!isNaN(Date.parse(arVal[j][prop]))) {
                                        // console.log('Valid Date \n')
                                        // (new Date(fromDate)).toUTCString()
                                        formData.append(
                                            `${arKey}[${j}][${prop}]`,
                                            new Date(arVal[j][prop])
                                        )
                                    } else {
                                        formData.append(`${arKey}[${j}][${prop}]`, arVal[j][prop])
                                    }
                                }
                            }
                        }
                    }
                    continue // we don't need to append current element now, as its elements already appended
                } else {
                    arVal = JSON.stringify(arVal)
                }
            }

            if (arVal === null) {
                continue
            }
            formData.append(arKey, arVal)
        }
        return formData
    }

});