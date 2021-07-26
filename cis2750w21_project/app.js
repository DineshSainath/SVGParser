'use strict'

const db_host = "dursley.socs.uoguelph.ca"

// C library API
// const ffi = require('ffi-napi');
// Express App (Routes)
const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const app = express();
const path = require("path");
const fileUpload = require('express-fileupload');
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname + '/uploads')));
app.use(session({ secret: 'somestrongsecret', resave: true, saveUninitialized: true }));
// Minimization
const fs = require('fs');
const xml2js = require('xml2js');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { exception } = require("console");
// Important, pass in port as in `npm run dev 1234`, do not change
const portNum = process.argv[2] || 8085;

//schema for creating new routes
var waypointSchema = {
  "$": {
    "lat": null,
    "lon": null
  },
  "name": []
}
var routeSchema = {
  "name": [],
  "desc": [],
  "rtept": []
}

var gpxFileSchema = {
  "gpx": {
    "$": {
      "version": null,
      "creator": null,
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "xmlns": "http://www.topografix.com/GPX/1/1",
      "xsi:schemaLocation": "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
    },
    "wpt": [],
    "rte": [],
    "trk": []
  }
}
app.get("/", function (req, res) {
  let err_code = req.session.err_code;
  let error_tag = ``;
  if (err_code) {
    error_tag = `<div class="alert alert-danger">${err_code}</div>`;
  }
  let login_page = `
  <!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>DS Gpx Parser Login</title>
		<style>
		.login-form {
			width: 600px;
			margin: 0 auto;
			font-family: Tahoma, Geneva, sans-serif;
		}
		.login-form h1 {
			text-align: center;
			color: #4d4d4d;
			font-size: 24px;
			padding: 20px 0 20px 0;
		}
		.login-form input[type="password"],
		.login-form input[type="text"] {
			width: 100%;
			padding: 15px;
			border: 1px solid #dddddd;
			margin-bottom: 15px;
			box-sizing:border-box;
		}
		.login-form input[type="submit"] {
			width: 100%;
			padding: 15px;
			background-color: #535b63;
			border: 0;
			box-sizing: border-box;
			cursor: pointer;
			font-weight: bold;
			color: #ffffff;
		}
    </style>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
    integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
	</head>
	<body>
    <div class="login-form">     
			<h1>DS Gpx Parser Login</h1>
			<form action="auth" method="POST">
        <input type="text" name="username" placeholder="Username" required>
				<input type="password" name="password" placeholder="Password" required>
        <input type="text" name="dbname" placeholder="Database Name" required>
				<input type="submit" value="Log In">
      </form>
      ${error_tag}
		</div>
	</body>
</html>
  `
  res.send(login_page);
});
app.post('/auth', async function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var dbname = req.body.dbname;
  console.log(username + password + dbname)
  let dbConf = {
    host: db_host,
    user: username,
    password: password,
    database: dbname
  };
  const { flag, msg } = await Connect2Database(dbConf);
  console.log(flag);
  if (flag) {
    req.session.loggedin = flag;
    req.session.username = username;
    req.session.password = password;
    req.session.dbname = dbname;
    console.log("redirecting");
    res.redirect('/home');
  }
  else {
    req.session.err_code = msg
    res.redirect("/");
  }
});
// Send HTML at root, do not change
app.get('/home', function (req, res) {
  console.log("Checking session:" + req.session.loggedin);
  if (req.session.loggedin) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
  } else {
    res.redirect('/');
  }
});

// Send Style, do not change
app.get('/style.css', function (req, res) {
  //Feel free to change the contents of style.css to prettify your Web app
  res.sendFile(path.join(__dirname + '/public/style.css'));
});

// Send obfuscated JS, do not change
app.get('/index.js', function (req, res) {
  fs.readFile(path.join(__dirname + '/public/index.js'), 'utf8', function (err, contents) {
    // const minimizedContents = JavaScriptObfuscator.obfuscate(contents, {compact: true, controlFlowFlattening: true});
    res.contentType('application/javascript');
    res.send(contents);
  });
});

//Respond to POST requests that upload files to uploads/ directory
app.post('/upload', function (req, res) {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }
  let uploadFile = req.files.uploadFile;
  try {

    // output = gpxvalidator.parseXml(uploadFile.data.toString('utf8'))

    if (uploadFile.name.endsWith(".gpx")) {
      var filedata = uploadFile.data.toString('utf8');
      var parser = new xml2js.Parser();
      var parsedData = {}
      parser.parseString(filedata, function (err, result) {
        parsedData = result
      });
      // Use the mv() method to place the file somewhere on your server
      uploadFile.mv('uploads/' + uploadFile.name, function (err) {
        if (err) {
          return res.status(500).send(err);
        }

      });
      res.send(parsedData)
    } else {
      throw "Not a valid gpx file!"
    }
  } catch (err) {
    res.send(err);
  }

});


//Respond to POST requests that upload files to uploads/ directory
app.post('/renamefile', function (req, res) {
  // Rename the file
  fs.rename(path.join(__dirname + '/uploads/' + req.body.filesForRename), path.join(__dirname + '/uploads/' + req.body.newname), () => {
    console.log("\nFile Renamed!\n");
    res.send("\nFile Renamed!\n")
    // List all the filenames after renaming
    // getCurrentFilenames();
  });
});

//add routes to existing files
app.post('/addRoute', function (req, res) {
  var contents = fs.readFileSync(path.join(__dirname + '/uploads/' + req.body["route-files"]), 'utf8');
  var parser = new xml2js.Parser();

  parser.parseString(contents, function (err, result) {
    if (result.gpx.rte && result.gpx.rte.filter(item => item.name == req.body["routename"]).length > 0) {
      result.gpx.rte.filter(item => item.name == req.body["routename"])[0].rtept = result.gpx.rte.filter(item => item.name == req.body["routename"])[0].rtept.concat(JSON.parse(req.body.waypoints).map(wp => {
        let x = Object.assign({}, waypointSchema)
        x.$ = wp
        return x
      }))
    } else {
      var newRouteObj = Object.assign({}, routeSchema);
      newRouteObj.name = req.body["routename"]
      newRouteObj.rtept = newRouteObj.rtept.concat(JSON.parse(req.body.waypoints).map(wp => {
        let x = Object.assign({}, waypointSchema)
        x.$ = wp
        return x
      }))
      result.gpx.rte = newRouteObj
    }
    var writeStream = fs.createWriteStream(path.join(__dirname + '/uploads/' + req.body["route-files"]));
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(result);
    writeStream.write(xml);
    writeStream.end();
    res.send("File updated Successfully!")
  });
});

//creates a GPX filecreateGPXfile
app.post('/createGPXfile', function (req, res) {
  // Rename the file
  var writeStream = fs.createWriteStream(path.join(__dirname + '/uploads/' + req.body.filename + ".gpx"));
  var newGPXObj = Object.assign({}, gpxFileSchema);
  newGPXObj.gpx.$.creator = req.body.Creator
  newGPXObj.gpx.$.version = req.body.version
  var builder = new xml2js.Builder();
  var xml = builder.buildObject(newGPXObj);
  writeStream.write(xml);
  writeStream.end();
  res.send("File Saved Successfully!")
});

//Respond to GET requests for files in the uploads/ directory
app.get('/getuploads', function (req, res) {
  fs.readdir('uploads/', function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    let filenames = {}
    //listing all files using forEach
    files.forEach(function (file) {
      // Do whatever you want to do with the file
      if (file.endsWith(".gpx")) {
        var contents = fs.readFileSync(path.join(__dirname + '/uploads/' + file), 'utf8');
        var parser = new xml2js.Parser();
        parser.parseString(contents, function (err, result) {
          filenames[file] = result
        });
      }
    });
    res.send(filenames)
  });
});
//Respond to GET requests for files in the uploads/ directory
app.get('/uploads/:name', function (req, res) {
  fs.stat('uploads/' + req.params.name, function (err, stat) {
    if (err == null) {
      var parser = new xml2js.Parser();
      var parsedData = {}
      var contents = fs.readFileSync(path.join(__dirname + '/uploads/' + req.params.name), 'utf8');
      parser.parseString(contents, function (err, result) {
        parsedData = result
      });
      res.send(parsedData);
    } else {
      console.log('Error in file downloading route: ' + err);
      res.send('');
    }
  });
});


//******************** Your code goes here ******************** 
app.get('/storeallfiles', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let results = await storeAllFiles(dbConf);
    return res.send("" + results);
  } else {
    return res.send("Session expired. Refresh to login again.");
  }
});

app.get('/dbstatus', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let results = await dbStatus(dbConf);
    return res.send(results);
  } else {
    return res.send("Session expired. Refresh to login again.");
  }
});

app.get('/cleardb', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let results = await cleardb(dbConf);
    return res.send(results);
  } else {
    return res.send("Session expired. Refresh to login again.");
  }
});


app.get('/query1', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let results = await query1(dbConf);
    return res.send(results);
  } else {
    return res.status(440).send("Session expired. Refresh to login again.");
  }
});


app.get('/query2', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let file_name = req.query.file_name;
    let results = await query2(dbConf, file_name);
    return res.send(results);
  } else {
    return res.status(440).send("Session expired. Refresh to login again.");
  }
});

app.get('/query3', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let route_id = req.query.route_id;
    let results = await query3(route_id, dbConf);
    console.log(results);
    return res.send(results);
  } else {
    return res.status(440).send("Session expired. Refresh to login again.");
  }
});

app.get('/query4', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let file_name = req.query.file_name;
    let results = await query4(file_name, dbConf);
    console.log(results);
    return res.send(results);
  } else {
    return res.status(440).send("Session expired. Refresh to login again.");
  }
});

app.get('/query5', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let N = req.query.N;
    let file_name = req.query.file_name;
    let order = req.query.order;

    let results = await query5(N, file_name, order, dbConf);
    console.log(results);
    return res.send(results);
  } else {
    return res.status(440).send("Session expired. Refresh to login again.");
  }
});

async function query1(dbConf) {
  let connection;
  let query;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    const [records, fields_id] = await connection.execute(`select * from ROUTE`);
    return { flag: true, records };
  } catch (e) {
    console.log(e);
    return {
      flag: false,
      records: []
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

async function query2(dbConf, file_name) {
  let connection;
  let query;
  let gpx_id = null;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    const [file_id_row, fields_id] = await connection.execute(`select gpx_id from FILE where file_name='${file_name}'`);
    gpx_id = file_id_row[0].gpx_id;
    const [records, fields_id2] = await connection.execute(`select * from ROUTE where gpx_id='${gpx_id}'`);
    return { flag: true, records };
  } catch (e) {
    console.log(e);
    return {
      flag: false,
      records: []
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

async function query3(route_id, dbConf) {
  let connection;
  let query;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    query = `
      SELECT POINT.* FROM POINT INNER JOIN ROUTE ON ROUTE.route_id=POINT.route_id WHERE ROUTE.route_id='${route_id}'
    `
    const [records, fields_id] = await connection.execute(query);
    console.log(records);
    return { flag: true, records };
  } catch (e) {
    console.log(e);
    return {
      flag: false,
      records: []
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

async function query4(file_name, dbConf) {
  let connection;
  let query;
  try {
    connection = await mysql.createConnection(dbConf);
    const [records, fields_id] = await connection.execute(`select POINT.*, ROUTE.route_name, ROUTE.route_id from FILE INNER JOIN ROUTE ON FILE.gpx_id = ROUTE.gpx_id INNER JOIN POINT ON POINT.route_id = ROUTE.route_id WHERE FILE.file_name='${file_name}' order by POINT.point_index`);
    console.log(records);
    return { flag: true, records };
  } catch (e) {
    console.log(e);
    return {
      flag: false,
      records: []
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

async function query5(N, file_name, order, dbConf) {
  let connection;
  let query = `
    SELECT ROUTE.* ,FILE.file_name
    FROM 
      ROUTE
    INNER JOIN FILE ON FILE.gpx_id = ROUTE.gpx_id
    WHERE FILE.file_name='${file_name}'
    ORDER BY ROUTE.route_len
    ${order}
    LIMIT ${N}
  `;
  try {
    // create the connection

    connection = await mysql.createConnection(dbConf);
    const [records, fields_id] = await connection.execute(query);
    console.log(records);
    return { flag: true, records };
  } catch (e) {
    console.log(e);
    return {
      flag: false,
      records: []
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}


async function query3_routes(dbConf) {
  let connection;
  let query = `
    select CONCAT("Route-", route_id) as route_unique_id, route_id from ROUTE;
  `;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    const [records, fields_id] = await connection.execute(query);
    console.log(records);
    return { flag: true, records };
  } catch (e) {
    console.log(e);
    return {
      flag: false,
      records: []
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}


//Sample endpoint
app.get('/query3-routes', async function (req, res) {
  if (req.session.loggedin) {
    let dbConf = {
      host: db_host,
      user: req.session.username,
      password: req.session.password,
      database: req.session.dbname
    };
    let results = await query3_routes(dbConf);
    console.log(results);
    return res.send(results);
  } else {
    return res.status(440).send("Session expired. Refresh to login again.");
  }
  
});
// ========================DB Functionalities===========================================
async function Connect2Database(dbConf) {
  let connection;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    let createFILETable = `CREATE TABLE IF NOT EXISTS FILE (
      gpx_id int AUTO_INCREMENT,
      file_name varchar(60) NOT NULL, 
      ver DECIMAL(2,1) NOT NULL, 
      creator VARCHAR(256) NOT NULL,
      PRIMARY KEY (gpx_id))`

    let createROUTETable = `
              CREATE TABLE IF NOT EXISTS ROUTE(
                  route_id int AUTO_INCREMENT,
                  route_name varchar(256),
                  route_len FLOAT(15,7) NOT NULL,
                  gpx_id int NOT NULL,
                  FOREIGN KEY (gpx_id) REFERENCES FILE(gpx_id) ON DELETE CASCADE,
                  PRIMARY KEY (route_id)
              )
            `
    let createPOINTTable = `
              CREATE TABLE IF NOT EXISTS POINT(
                point_id int AUTO_INCREMENT,
                point_index int NOT NULL,
                latitude DECIMAL(11,7) NOT NULL,
                longitude DECIMAL(11,7) NOT NULL,
                point_name VARCHAR(256),
                route_id int NOT NULL,
                FOREIGN KEY (route_id) REFERENCES ROUTE(route_id) ON DELETE CASCADE,
                primary Key (point_id)
              )
    `
    connection.execute(createFILETable);
    connection.execute(createROUTETable);
    connection.execute(createPOINTTable);
    return { flag: true, msg: "Success" };
  } catch (e) {
    console.log("Connection error: " + e);
    return { flag: false, msg: "" + e };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

async function InsertFile(file_info, dbConf) {
  let connection;
  let insert_query;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    const { file_name, ver, creator } = file_info;
    const [file_id_row, fields_id] = await connection.execute(`select gpx_id from FILE where file_name='${file_name}'`);
    if (file_id_row.length == 0) {
      insert_query = `INSERT INTO FILE(file_name,ver,creator) VALUES('${file_name}',${ver},'${creator}')`;
      const [rows1, fields1] = await connection.execute(insert_query);
      console.log("Working ....");
      console.log(rows1);
      return {
        flag: true,
        count: rows1.affectedRows,
        gpx_id: rows1.insertId
      };
    }
    else{
      return {
        flag: false,
        count: 0,
        gpx_id: null
      }
    }
  } catch (e) {
    console.log(insert_query);
    console.log(e);
    return {
      flag: false,
      count: 0,
      gpx_id: null
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

async function InsertRoute(route_info, dbConf) {
  let connection;
  let insert_query;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    const { route_name, route_len, gpx_id } = route_info;
 
    insert_query = `INSERT INTO ROUTE(route_name, route_len, gpx_id) VALUES('${route_name}',${route_len},'${gpx_id}')`;
    const [rows1, fields1] = await connection.execute(insert_query);
    console.log("Working ....");
    console.log(rows1);
    return {
      flag: true,
      count: rows1.affectedRows,
      route_id: rows1.insertId
    };
  } catch (e) {
    console.log(insert_query);
    console.log(e);
    return {
      flag: false,
      count: 0,
      route_id: null
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

async function InsertPoint(point_info, dbConf) {
  let connection;
  let insert_query;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    const { point_index, latitude, longitude, point_name, route_id } = point_info;
    insert_query = `INSERT INTO POINT(point_index, latitude, longitude, point_name, route_id) VALUES('${point_index}',${latitude},'${longitude}','${point_name}','${route_id}')`;
    const [rows1, fields1] = await connection.execute(insert_query);
    console.log("Working ....");
    console.log(rows1);
    return {
      flag: true,
      count: rows1.affectedRows,
      point_id: rows1.insertId
    };
  } catch (e) {
    console.log(insert_query);
    console.log(e);
    return {
      flag: false,
      count: 0,
      point_id: null
    };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}


async function storeAllFiles(dbConf) {
  let files = fs.readdirSync('uploads/');
  let all_rows = 0;
  let filenames = {};
  files.forEach(file => {
    if (path.extname(file) == '.gpx') {
      var contents = fs.readFileSync(path.join(__dirname + '/uploads/' + file), 'utf8');
      var parser = new xml2js.Parser();
      parser.parseString(contents, function (err, result) {
        filenames[file] = result
      });
    }
  });
  for (const [file, result] of Object.entries(filenames)) {
    let file_info = {
      "file_name": file,
      "ver": result.gpx['$'].version ? result.gpx['$'].version : null,
      "creator": result.gpx['$'].creator ? result.gpx['$'].creator : null
    };

    console.log(file_info)
    let { flag, count, gpx_id } = await InsertFile(file_info, dbConf);
    if( gpx_id && result.gpx.rte){
      // result.gpx.rte.forEach( function(route)  
      for (let index = 0; index < result.gpx.rte.length; index++) {
        const route = result.gpx.rte[index];
        let dist = 0;
        let route_info = {
          "route_name": null,
          "route_len": 0,
          "gpx_id": gpx_id
        }
        if (route.name) {
          route_info.route_name = route.name[0];
        }
        let npoints = route.rtept.length;
        let points_in_route = []
  
        for (let i = 0; i < npoints - 1; i++) {
          const a = route.rtept[i];
          let latitude = a['$']['lat'];
          let longitude = a['$']['lon'];
          let point_name = a['name'];
          let point_info = {
            "point_index" : i,
            latitude,
            longitude,
            point_name
          }
          
          dist = dist + distance(latitude, longitude, route.rtept[i + 1]['$']['lat'], route.rtept[i + 1]['$']['lon'], 'm')
          points_in_route.push(point_info);
          if(i+1 == npoints -1 ){
            points_in_route.push({
              "point_index": i+1,
              "latitude": route.rtept[i + 1]['$']['lat'],
              "longitude": route.rtept[i + 1]['$']['lon'],
              "point_name":route.rtept[i + 1]['name']
  
            })
          }
        }
        route_info.route_len = dist;
        let { flag, count, route_id } = await InsertRoute(route_info, dbConf);
        if( route_id ){
          for (let i = 0; i < points_in_route.length; i++) {
            let point_info = points_in_route[i];
            point_info.route_id = route_id;
            let { flag, count, point_id } = await InsertPoint(point_info, dbConf);
            if(point_id){
              console.log("Inserted point ...");
            } 
          }

        }
      }
      if (flag) {
        all_rows += count;
      }
    }
  }
  console.log(all_rows);
  return all_rows;
}

async function dbStatus(dbConf) {
  let connection;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    const [file_rows, file_fields] = await connection.execute('SELECT count(*) as count from `FILE`');
    const [route_rows, route_fields] = await connection.execute('SELECT count(*) as count from `ROUTE`');
    const [point_rows, point_fields] = await connection.execute('SELECT count(*) as count from `POINT`');

    let file_count = file_rows[0].count;
    let route_count = route_rows[0].count;
    let point_count = point_rows[0].count;

    return { flag: true, msg: "Success", file_count, route_count, point_count };
  } catch (e) {
    console.log("Error: " + e);
    return { flag: false, msg: "" + e, file_count: 0, download_count: 0 };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

async function cleardb(dbConf) {
  let connection;
  try {
    // create the connection
    connection = await mysql.createConnection(dbConf);
    const [rows3, fields3] = await connection.execute('DELETE FROM `POINT`');
    const [rows2, fields2] = await connection.execute('DELETE FROM `ROUTE`');
    const [rows1, fields1] = await connection.execute('DELETE FROM `FILE`');

    return {
      flag: true,
      msg: `Successfully cleared the tables.<br> FILE: ${rows1.affectedRows} rows affected. <br> ROUTE: ${rows2.affectedRows} rows affected. <br> POINT: ${rows3.affectedRows} rows affected.`
    };
  } catch (e) {
    return { flag: false, msg: "" + e };
  } finally {
    if (connection && connection.end) {
      connection.end();
    }
  }
}

//***************************************************************** */
app.listen(portNum);
console.log('Running app at localhost: ' + portNum);

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