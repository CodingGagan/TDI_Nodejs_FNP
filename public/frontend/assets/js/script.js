// $(function(){
//   $('.dropdown').on('show.bs.dropdown', function(e){
//       $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
//     });

//     $('.dropdown').on('hide.bs.dropdown', function(e){
//       e.preventDefault();
//       $(this).find('.dropdown-menu').first().stop(true, true).slideUp(400, function(){
//         $('.dropdown').removeClass('open');
//           $('.dropdown').find('.dropdown-toggle').attr('aria-expanded','false');
//       });
//     });
//   });
// Navbar Js Only

$(function () {
  $(".menu_toggle").click(function () {
    showNavDrawer();
    $(this).toggleClass("change");
    $("body").toggleClass("menuBodyCls");
  });
  $(window).width(function () {
    sideNav();
  });
  $(window).resize(function () {
    sideNav();
  });
  $("nav .menu_overlay").click(function () {
    $("nav .navigation-list").toggleClass("nav-collsaped");
    $("nav .menu_overlay").toggleClass("body-overlay");
    $(".menu_toggle").removeClass("change");
    $("body").removeClass("menuBodyCls");
  });
  function sideNav() {
    if ($(window).width() <= 991) {
    } else {
      $("nav .navigation-list").removeClass("nav-collsaped");
      $("nav .overlay").removeClass("body-overlay");
      $(".menu_toggle").removeClass("change");
    }
  }
  function showNavDrawer() {
    $("nav .navigation-list").toggleClass("nav-collsaped");
    $("nav .menu_overlay").toggleClass("body-overlay");
  }
});

// Navbar Js Only

// Scroll Navbar Fixed Js Only

// $(window).scroll(function () {
//   var body = $("body"),
//     scroll = $(window).scrollTop();
//   if (scroll >= 1) body.addClass("bodyCls");
//   else body.removeClass("bodyCls");
//   console.log(window.scrollY);
// });

const body = document.body;
const triggerMenu = document.querySelector(".header");
const scrollUp = "scroll-up";
const scrollDown = "scroll-down";
let lastScroll = 0;

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll <= 0) {
    body.classList.remove(scrollUp);
    return;
  }

  if (currentScroll > lastScroll && !body.classList.contains(scrollDown)) {
    // down
    body.classList.remove(scrollUp);
    body.classList.add(scrollDown);
  } else if (
    currentScroll < lastScroll &&
    body.classList.contains(scrollDown)
  ) {
    // up
    body.classList.remove(scrollDown);
    body.classList.add(scrollUp);
  }
  lastScroll = currentScroll;
});

// Scroll Navbar Fixed Js Only

// Owl Slider Js Only

$(".bannerSliderCarousel").owlCarousel({
  loop: true,
  dots: true,
  nav: false,
  items: 1,
  mouseDrag: false,
  autoplay: true,
  autoplayTimeout: 30000,
  responsiveClass:true,
  responsive: {
    0: {
      items: 1,
    },
    600: {
      items: 1,
    },
    1000: {
      items: 1,
    },
  },
});

$(".productSliderCarousel").owlCarousel({
  loop: false,
  dots: false,
  center: true,
  nav: true,
  navText: [
    "<i class='fas fa-chevron-left'></i>",
    "<i class='fas fa-chevron-right'></i>",
  ],
  items: 1,
  autoplay: true,
  autoplayTimeout: 30000,
  responsive: {
    0: {
      items: 1,
    },
    600: {
      items: 2,
    },
    1000: {
      items: 3,
    },
  },
});

$(".prodSortSliderCarousel").owlCarousel({
  loop: false,
  dots: true,
  margin: 20,
  items: 1,
  autoplay: true,
  autoplayTimeout: 30000,
  responsive: {
    0: {
      items: 1,
    },
    567: {
      items: 2,
    },
    1024: {
      items: 3,
    },
    1299: {
      items: 4,
    },
  },
});

// Owl Slider Js Only


/** Toggle search by taste */
$(".prod-filter-btn").click(function () {
  $(".prod-filtered-box").toggleClass("d-block");
});


/** Toggle size button */
$(".size-btn").click(function () {
  $(".size-options").toggleClass("d-block");
});