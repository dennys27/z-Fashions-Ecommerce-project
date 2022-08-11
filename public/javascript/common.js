function removeAddress(uId) {
    console.log(uId);
    
  $.ajax({
    url: "/delete-address",
    data: {
      uId
    },
    method: "post",
    success: (response) => {
      console.log(response);
      if (response.deleted) {
          swal("address deleted successfully")
          location.reload()
      } else {
        swal("something went wrong");
      }
    },
  });
}


function makeItDefault(uId,objectId) {
  console.log(uId);
  console.log(objectId);

  $.ajax({
    url: "/make-default",
    data: {
      uId,
    },
    method: "post",
    success: (response) => {
      console.log(response);
      if (response.deleted) {
        swal("default address changed");
        location.reload();
      } else {
        swal("something went wrong");
      }
    },
  });
}
