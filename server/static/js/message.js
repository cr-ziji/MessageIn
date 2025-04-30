function send(){
    let text = document.querySelector('#textarea').value;
    if(!text){
        alert('请输入内容');
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