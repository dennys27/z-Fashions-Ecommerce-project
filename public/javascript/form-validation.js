



function validate(event) {
  let phnalpha = /[A-Za-z]/;
  let phoneNumber = /^[6-9]\d{9}$/gi;
    let phone = document.getElementById("phn").value;
    console.log(phone);
    if (!phnalpha.test(phone)) {
        if (phoneNumber.test(phone)) {
            return true;
        } else {
            document.getElementById("invalidphn").style.visibility = "visible";
            event.preventDefault();
            return false;
        }
    } else {

         document.getElementById("invalidphn").style.visibility = "visible";
         event.preventDefault();
         return false;
        
    }
}

 setTimeout(() => {
     document.getElementById("invalidphn").style.visibility = "hidden";
     console.log("working");
 }, 3000);
