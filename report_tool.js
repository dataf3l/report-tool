var mysql      = require('mysql');
const basicAuth = require('express-basic-auth');

const get_db_results = (query, cb) => {
    var output = []
    var connection = mysql.createConnection({
        host     : process.env.DBHOST,
        user     : process.env.DBUSER,
        password : process.env.DBPASS,
        database : process.env.DBNAME
    });
    connection.connect();
    connection.query(query, function (error, results, fields) {
        if (error) throw error;
        for(let x=0;x<results.length;x++){
            let row = results[x];
            var r = {};
            for(var field in row){
                r[field] = row[field];
            }
            output.push(r);
        }
        cb(output);
    });
    connection.end();
}
const table = (dataset,options) => {
    if(typeof(options)!='object'){
        console.log("Invalid options");
        return [];
    }
    if(!'html' in options){
        options['html'] = '0';
    }
    let dx = "<table border=1 cellspacing=0 cellpadding=3>";
    for(let r in dataset){
        let row = dataset[r];
        dx += "<tr>";
        for(let field in row){
            dx += "<th>";
            dx += field;
            dx += "</th>";
        }
        dx += "</tr>\n";
        break;
    }
    for(let r in dataset){
        let row = dataset[r];
        dx += "<tr>";
        for(let field in row){
            dx += "<td>";
            if(options['html']=='1'){
                dx += ""+row[field];
            }else{
                dx += "<xmp>" + row[field]+"</xmp>";
            }
            
            dx += "</td>";
        }
        dx += "</tr>\n";
    }
    dx += "</table>";
    return dx;
}
const header = () => {
    return "<!DOCTYPE html5><html><head><link rel='stylesheet' href='/style.css' type='text/css'/></head><body>";
}
const footer = () => {
    return "</body></html>";
}
const main = () => {
    const express = require('express');
    const app = express();
    const port = 4568;
    app.use(express.static('public'));
    let users = {};
    users[process.env.HTTP_BASIC_AUTH_USER] = process.env.HTTP_BASIC_AUTH_PASS;
    app.use(basicAuth({
        users: users,
        challenge: true // <--- needed to actually show the login dialog!
    }));
    

    app.get('/', (req, res) => {
        let report_title = "Reports";
        get_db_results("SELECT id,title from report", (db_results) => {
            for(var r of db_results){
                r["title"] = "<a href='/v1/show_report/"+r["id"]+"'>" + r["title"] + "</a>";
            }
            var html = table(db_results,{'html':'1'});
            res.send(header() + "<h1>" + report_title+"</h1>" + html);
        });
    });

    app.get('/v1/show_report/:report_id', (req, res) => {
        let report_id = parseInt(req.params.report_id,10);
        let report_title = "JOBS";
        res.setHeader('Content-Type', 'text/html');
        get_db_results("select title,sql_query from report where id = '"+parseInt(report_id,10)+"' ", (q_results) => {    
            if(q_results.length == 0) { 
                res.send(header() + "<h1>No such report id:"+report_id+"</h1>");
                return;
            }
            let q = q_results[0]['sql_query'];
            let report_title = q_results[0]['title'];

            get_db_results(q, (db_results) => {
                var html = table(db_results,{'html':'0'});
                res.send(header() + "<h1>" + report_title+"</h1>" + html);
            });
        });
        
    });

    app.listen(port, () => {
        console.log(`Report Server listening at http://localhost:${port}`)
    });

}
main();