function hide() {
  $('#list').fadeOut(1000);
  $('#close , #list-item').fadeIn(1000);
}
function show() {
  $('#list').fadeIn(1000);
  $('#close , #list-item').fadeOut(1000);
}
$('.upd-btn').click(function (){
  $('.form-container').css({
    "display":"block"
  })
})
