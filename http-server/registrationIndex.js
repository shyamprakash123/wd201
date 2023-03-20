const retriveEntries = () =>{
    let entries = localStorage.getItem('user-entries');
    if(entries){
      entries = JSON.parse(entries);
    } else {
      entries = [];
    }
    return entries;
  }
  
  const display = () => {
    let userentries = retriveEntries();
  
    const tableEntries = userentries.map((entries) => {
      const namecell = `<td>${entries.name}</td>` ;
      const emailcell = `<td>${entries.email}</td>` ;
      const passwordcell = `<td>${entries.password}</td>` ;
      const dobcell = `<td>${entries.dob}</td>` ;
      const checkcell = `<td>${entries.acceptedTerm}</td>` ;
  
      const row = `<tr>${namecell} ${emailcell} ${passwordcell} ${dobcell} ${checkcell}</tr>`;
  
      return row;
    }).join("\n");
  
    const table = 
    `<table id="table" style="width: 100%;">
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Password</th>
      <th>dob</th>
      <th>accepted terms?</th>
    </tr> ${tableEntries} </table>`;
  
  const tableField = document.getElementById('table');
  tableField.innerHTML = table;
   
  }
  
  function setDate(){
  var todayDate = new Date();
    
  var minDate = new Date(todayDate.getFullYear() - 18, todayDate.getMonth(), todayDate.getDate());
  
  var maxDate = new Date(todayDate.getFullYear() - 55, todayDate.getMonth(), todayDate.getDate());
  
  var minDateISO = minDate.toISOString().split('T')[0];
  var maxDateISO = maxDate.toISOString().split('T')[0];
  
  document.getElementById("dob").setAttribute("min", maxDateISO);
  document.getElementById("dob").setAttribute("max", minDateISO);
  display();
  }
  
  setDate();
  
  
  var form = document.getElementById('user-form'); 
  form.addEventListener('submit',function(event){
    userentries =retriveEntries();
    event.preventDefault();
    
    let name =document.getElementById('name').value
    let email =document.getElementById('email').value
    let password =document.getElementById('password').value
    let dob =document.getElementById('dob').value
    let acceptedTerm =document.getElementById('checkbox').checked
  
    userlist = {
      name,
      email,
      password,
      dob,
      acceptedTerm
    }
  
    userentries.push(userlist);
  
    localStorage.setItem("user-entries",JSON.stringify(userentries));
    display();
  });