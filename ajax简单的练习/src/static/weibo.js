var timeString = function(timestamp) {
    t = new Date(timestamp * 1000)
    t = t.toLocaleTimeString()
    return t
}

var commentsTemplate = function(comments) {
    var html = ''
    for(var i = 0; i < comments.length; i++) {
        var c = comments[i]
        var t = `
            <div id='comment-${c.id}' data-id='${c.id}'>
                ${c.content}
                <button class="comment-delete">删除评论</button>
            </div>
        `
        html += t
    }
    return html
}

var WeiboTemplate = function(Weibo) {
    var content = Weibo.content
    var id = Weibo.id
    var comments = commentsTemplate(Weibo.comments)
    var t = `
        <div class='weibo-cell' id='weibo-${id}' data-id=${id}>
          <span class='weibo-content'>[WEIBO]: ${content}</span>
          <button class="weibo-delete">删除微博</button>
          <button class="weibo-edit">编辑微博</button>
          <div class="comment-form" >
            <input type="hidden" class="comment-weibo-id" value="">
            <input class="comment-content">
            <br>
            <button class="comment-add">添加评论</button>
          </div>
          <div class="comment-list">
            ${comments}
          </div>
        </div>
    `
    return t
    /*
    上面的写法在 python 中是这样的
    t = """
    <div class="Weibo-cell">
        <button class="Weibo-delete">删除</button>
        <span>{}</span>
    </div>
    """.format(Weibo)
    */
}

var insertWeibo = function(Weibo) {
    var WeiboCell = WeiboTemplate(Weibo)
    // 插入 Weibo-list
    var WeiboList = e('.weibo-list')
    WeiboList.insertAdjacentHTML('beforeend', WeiboCell)
}


var insertComment = function(comment) {
    var commentCell = `
            <div id='comment-${comment.id}' data-id='${comment.id}'>
                ${comment.content}
                <button class="comment-delete">删除评论</button>
            </div>
        `
    // 插入 Weibo-list
    var selector = '#weibo-' + comment.weibo_id
    var weibocell = e(selector)
    var commentList = weibocell.querySelector('.comment-list')
    commentList.insertAdjacentHTML('beforeend', commentCell)
}


var insertEditForm = function(cell) {
    var form = `
        <div class='weibo-edit-form' id='edit-form-${cell.dataset.id}' data-id='${cell.dataset.id}'>
            <input class="weibo-update-content">
            <button class='weibo-update'>更新微博</button>
        </div>
    `
    cell.insertAdjacentHTML('afterend', form)
}

var loadWeibos = function() {
    // 调用 ajax api 来载入数据
    apiWeiboAll(function(r) {
        // console.log('load all', r)
        // 解析为 数组
        var Weibos = JSON.parse(r)
        // 循环添加到页面中
        for(var i = 0; i < Weibos.length; i++) {
            var Weibo = Weibos[i]
            insertWeibo(Weibo)
        }
    })
}

var bindEventWeiboAdd = function() {
    var b = e('#id-button-add-weibo')
    // 注意, 第二个参数可以直接给出定义函数
    b.addEventListener('click', function(){
        var input = e('#id-input-weibo')
        var content = input.value
        log('click add', content)
        var form = {
            'content': content,
        }
        apiWeiboAdd(form, function(r) {
            // 收到返回的数据, 插入到页面中
            var Weibo = JSON.parse(r)
            insertWeibo(Weibo)
        })
    })
}

var bindEventWeiboDelete = function() {
    var WeiboList = e('.weibo-list')
    // 注意, 第二个参数可以直接给出定义函数
    WeiboList.addEventListener('click', function(event){
        var self = event.target
        if(self.classList.contains('weibo-delete')){
            // 删除这个 Weibo
            var WeiboCell = self.parentElement
            log('WeiboCell : ', WeiboCell)
            var Weibo_id = WeiboCell.dataset.id
            log('weibo id : ', Weibo_id)
            apiWeiboDelete(Weibo_id, function(r){
                log('删除成功', Weibo_id)
                WeiboCell.remove()
            })
        }
    })
}

var bindEventWeiboEdit = function() {
    var WeiboList = e('.weibo-list')
    // 注意, 第二个参数可以直接给出定义函数
    WeiboList.addEventListener('click', function(event){
        var self = event.target
        if(self.classList.contains('weibo-edit')){
            // 隐藏这个 Weibo
            var WeiboCell = self.parentElement
            WeiboCell.style.display = 'none'
            insertEditForm(WeiboCell)
        }
    })
}


var bindEventWeiboUpdate = function() {
    var WeiboList = e('.weibo-list')
    // 注意, 第二个参数可以直接给出定义函数
    WeiboList.addEventListener('click', function(event){
        var self = event.target
        if(self.classList.contains('weibo-update')){
            log('点击了 update ')
            //
            var editForm = self.parentElement
            // querySelector 是 DOM 元素的方法
            // document.querySelector 中的 document 是所有元素的祖先元素
            var weibo_id = editForm.dataset.id
            var input = editForm.querySelector('.weibo-update-content')
            var content = input.value
            var form = {
                'id': weibo_id,
                'content': content,
            }
            log('form:', form)
            apiWeiboUpdate(form, function(r){
                log('更新成功')
                var Weibo = JSON.parse(r)
                var selector = '#weibo-' + Weibo.id
                var WeiboCell = e(selector)
                var titleSpan = WeiboCell.querySelector('.weibo-content')
                titleSpan.innerHTML = Weibo.content
                selector = '#edit-form-'+ Weibo.id
                log("selector", selector)
                editform = e(selector)
                editform.remove()
                WeiboCell.style.display = 'block'

//                WeiboCell.remove()
            })
        }
    })
}


var bindEventCommentAdd = function() {
    var b = e('.weibo-list')
    // 注意, 第二个参数可以直接给出定义函数
    b.addEventListener('click', function(event){
        var self = event.target
        if(self.classList.contains('comment-add')){
            log('点击了 comment-add ')
            var commentForm = self.parentElement
            var input = commentForm.querySelector('.comment-content')
            var content = input.value
            var weibocell = input.closest('.weibo-cell')
            var weibo_id = weibocell.dataset.id
            log('click add', content)
            var form = {
                'weibo_id': weibo_id,
                'content': content,
            }
            apiCommentAdd(form, function(r) {
                // 收到返回的数据, 插入到页面中
                var Comment = JSON.parse(r)
                insertComment(Comment)
            })
        }
    })
}


var bindEventCommentDelete = function() {
    var WeiboList = e('.weibo-list')
    // 注意, 第二个参数可以直接给出定义函数
    WeiboList.addEventListener('click', function(event){
        var self = event.target
        if(self.classList.contains('comment-delete')){
            // 删除这个 Weibo
            var commentCell = self.parentElement
            var comment_id = commentCell.dataset.id
            apiCommentDelete(comment_id, function(r){
                log('删除成功', comment_id)
                commentCell.remove()
            })
        }
    })
}


var bindEvents = function() {
    bindEventWeiboAdd()
    bindEventWeiboDelete()
    bindEventWeiboEdit()
    bindEventWeiboUpdate()
    bindEventCommentAdd()
    bindEventCommentDelete()
}

var __main = function() {
    bindEvents()
    loadWeibos()
}

__main()
