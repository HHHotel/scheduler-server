/* eslint no-console: "off" */

class HHHDatabase { 

    /*
        var connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'me',
            password : 'secret',
            database : 'my_db'
        });
    */

    constructor () {
        this.sql = require('mysql');
        this.db = this.sql.createConnection({
            host    : 'localhost',
            user    : 'matt',
            password: 'Kodybear',
            database: 'HHH_Database'
        });
    }

    /*
    Gets Dog object 
    {
        name: "",   Dogs Name
        cName; ""   Client's Last Name

    }
    */
    insert (dog) {

    }

    /*
    Gets Event Object
    {
        type: "",   Boarding --- Daycare --- (Other Grooming etc.) 
        text: "",   if type === Other
        dates: []   Size 1 if daycare size 2 if Boarding [Start, End]

    }
    */

    add (event) {

    }

    /*
    Gets ID, ColumnName to be Edited 
    {
       
       
       

    }
    */

    edit (ID, tableName, columnName) {

    }

}

const DB = new HHHDatabase();

DB.test();


exports.module = HHHDatabase;