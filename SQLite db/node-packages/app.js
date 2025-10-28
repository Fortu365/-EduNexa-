const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./mydb', (error) => (
	
));

db.all("SELECT full_names FROM CreateAccount", [], (error, rows) => {
	
	if(error){
	   console.log(error)
	}
	

	rows.forEach((row) => {
	console.log(row.full_names)
   });

});

db.close((err) => {
	
});