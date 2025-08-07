jQuery(document).ready(function($) {
    $('.utility-bar.all').hide();
    
    $('.main-image').hover(
        (ev) => {
            let parent = $(ev.target).parents('.main-image');
            $('.utility-bar.all', parent).show();
        }, 
        (ev) => {
            let parent = $(ev.target).parents('.main-image');
            $('.utility-bar.all', parent).hide()
        }
    );
    
    $('.click-show-measurement').click(({target})=>{
        console.log('%ctarget: %o', 'color: red;font-size:12px', target);
        let parent = $(target).parents('.card-img');
        $('.spec-sheets', parent).hide();
        $('.measurements', parent).show();
    });
    
    $('.click-show-spec').click(({target})=>{
        let parent = $(target).parents('.card-img');
        $('.measurements', parent).hide();
        $('.spec-sheets', parent).show();
    });
    
    $('.close').click((ev)=>{
        let parent = $(ev.target).parents('.info-layer ');
        $(parent).hide();
    });
});
