function send(){
    let text = document.querySelector('#textarea').value;
    if(!text){
        alert('请输入内容');
        return ;
    }
    var atext =text.trim();
    if(atext.length <= 0){
        alert('不能输入全是空格')
        let x = document.getElementById("textarea");
        x.value = "";
        return ;
    }
    let item = document.createElement('div');
    item.className = 'item item-right';
    item.innerHTML = `<div class="bubble bubble-left">${text}</div><div class="avatar"><img sr></div>`;
    document.querySelector('.content').appendChild(item);c="../image/touxiang.jpg"
    document.querySelector('#textarea').value = '';
    document.querySelector('#textarea').focus();
    //滚动条置底
    document.querySelector(".content").scrollTop = document.querySelector('.content').scrollHeight;

}