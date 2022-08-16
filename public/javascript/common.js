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
  $.ajax({
    url: "/make-default",
    data: {
      uId,
    },
    method: "post",
    success: (response) => {
      console.log(response);
      if (response.default) {
        swal("default address changed");
        location.reload();
      } else {
        swal("something went wrong");
      }
    },
  });
}


$("#add-coupons").submit((event) => {
  event.preventDefault();
  $.ajax({
    url: "/admin/add-coupons",
    method: "post",
    data: $("#add-coupons").serialize(),
    success: (response) => {
      if (response.acknowledged) {
        swal("updated successfully");
        location.href = "/";
      }
    },
  });
});


function deleteCoupons(uId) {
  
  swal({
    title: "Are you sure?",
    text: "Once deleted, you will not be able to recover this coupon!",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willDelete) => {
    if (willDelete) {
  $.ajax({
    url: "/admin/delete-coupons",
    data: {
      uId,
    },
    method: "post",
    success: (response) => {
      if (response.acknowledged) {
        swal("coupon deleted successfully");
        location.reload();
      } else {
        swal("something went wrong");
      }
    },
  });

    } else {
      swal("Your coupon is safe!");
    }
  });
}

function applycoupon(uId) {
  
  $.ajax({
    url: "/admin/apply-coupons",
    data: {
      uId,
    },
    method: "post",
    success: (response) => {
      if (response.acknowledged) {
        swal("coupon applied successfully");
        location.reload();
      } else {
        swal("something went wrong");
      }
    },
  });
}