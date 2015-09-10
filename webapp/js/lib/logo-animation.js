jQuery(document).ready(function($) {

	var animating = false

		$(".header-logo").mouseenter(function(){
				if (animating == false)
				{
					animating = true;

					$('.logo-animation-layer').hide('puff', {easing: "easeInOutCubic", percent: 200, direction: 'down', marginTop: '30px'}, 1000, function(){
						$('.logo-animation-layer').show();
						animating = false;
					});
				}
		});
});