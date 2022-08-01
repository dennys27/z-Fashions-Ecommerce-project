$("#changepsw").submit((event) => {
  event.preventDefault();

  var password = document.getElementById("txtPassword").value;
  var confirmPassword = document.getElementById("txtConfirmPassword").value;
  if (password != confirmPassword) {
    alert("Passwords do not match.");
    return false;
  } {


    $.ajax({
      url: "/change-password",
      method: "post",
      data: $("#changepsw").serialize(),
      success: (response) => {
        if (response.acknowledged) {
          location.href = "/";
        }
        alert("order placed successfully");
      },
    });
  }
});


$("#personalfm").submit((event) => {
  event.preventDefault();
  $.ajax({
    url: "/profile-edit",
    method: "post",
    data: $("#personalfm").serialize(),
    success: (response) => {
      if (response.acknowledged) {
        location.href = "/";
      }
      alert("updated successfully");
    },
  });
});



$("#address-form").submit((event) => {
  event.preventDefault();
  $.ajax({
    url: "/user-address-update",
    method: "post",
    data: $("#address-form").serialize(),
    success: (response) => {
      if (response.acknowledged) {
        location.href = "/";
      }
      alert("updated successfully");
    },
  });
});
