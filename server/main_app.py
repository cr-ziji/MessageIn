# coding=UTF-8
from flask import Flask, request, render_template, redirect, session
from flask_socketio import SocketIO, emit, join_room, leave_room
import pymongo
import uuid, time

client = pymongo.MongoClient()
db = client.main

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'  # 加密密钥（生产环境需修改）
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')  # 允许跨域


app.secret_key = '123456'
classlist = {
    '初一': ['一班', '二班', '三班', '四班', '五班', '六班'],
    '初二': ['一班', '二班', '三班', '四班'],
    '初三': ['一班', '二班', '三班', '联培班'],
    '高一': ['一班', '二班', '三班'],
    '高二': ['一班', '二班', '三班', '四班'],
    '高三': ['一班', '二班', '三班', '四班']
}
video = {'01_功能文档.md': '', '02_学生端帮助文档.md': '学生端帮助视频.mp4', '03_教师端帮助文档.md': '教师端帮助视频.mp4', '04_教师使用守则.md': ''}
user_ip = {}
user_list = ['初一通知', '初二通知', '初三通知', '高一通知', '高二通知', '高三通知', '全校通知']


@app.route('/login')
def login():
    if 'alert' not in request.args:
        a = 0
    else:
        a = request.args['alert']
    return render_template('login.html',
                           t_alert=a)


@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')


@app.route('/register')
def register():
    if 'alert' not in request.args:
        a = 0
    else:
        a = request.args['alert']
    return render_template('register.html',
                           t_alert=a)


@app.route('/handle', methods=['post'])
def handle():
    if request.form['type'] == '登录':
        dict1 = {
            '手机号': request.form['tel'],
            '密码': request.form['password']
        }
        have = db.teacher.find_one(dict1)
        if have is None:
            return redirect('/login?alert=1')
        session['用户名'] = have['用户名']
        session['手机号'] = have['手机号']
        session['密码'] = have['密码']
        session['班级'] = have['班级']
        return redirect('/home')
    elif request.form['type'] == '注册':
        if 'class' not in request.form:
            return redirect('/register?alert=1')
        name = request.form['subject']+request.form['name']+'老师'
        dict1 = {
            '用户名': name,
            '手机号': request.form['tel'],
            '密码': request.form['password'],
            '班级': dict(request.form)['class']
        }
        have = db.teacher.find_one({'手机号': request.form['tel']})
        if have is not None:
            return redirect('/register?alert=2')
        db.teacher.insert_one(dict1)
        session['用户名'] = name
        session['手机号'] = request.form['tel']
        session['密码'] = request.form['password']
        session['班级'] = dict(request.form)['class']
        return redirect('/home')

@app.route('/help')
def help():
    if request.args['name'] not in video:
        return redirect('/home')
    f = open('static/file/'+request.args['name'], 'r', encoding="utf-8")
    t = f.read()
    f.close()
    return render_template('help.html', t_text=t, t_name=video[request.args['name']])


@app.route('/visitor')
def visitor():
    session['用户名'] = '访客'
    session['手机号'] = ''
    session['密码'] = ''
    session['班级'] = []
    for i in classlist:
        for j in classlist[i]:
            session['班级'].append(i+j)
        session['班级'].append(i+'通知')
    session['班级'].append('全校通知')
    return redirect('/home')


@app.route('/change')
def change():
    return render_template('change.html',
                           t_name=session['用户名'],
                           t_tel=session['手机号'],
                           t_password=session['密码'],
                           t_class=session['班级'])


@app.route('/admin')
def admin():
    if session['用户名'] != '管理员':
        return redirect('/home')
    user1 = list(db.teacher.find())
    return render_template('admin.html',
                           t_user=user1)


@app.route('/user')
def user():
    user1 = db.teacher.find_one({'手机号': request.args['tel']})
    return render_template('user.html',
                           t_user=user1)


@app.route('/logoff')
def logoff():
    db.teacher.delete_one({'手机号': session['手机号']})
    session.clear()
    # 需要实现：删除该用户发送的消息
    return redirect('/login')


@app.route('/delete')
def delete():
    db.teacher.delete_one({'手机号': request.args['tel']})
    # 需要实现：删除该用户发送的消息
    return ''


@app.route('/alter', methods=['post'])
def alter():
    if 'subject' in request.form:
        name = request.form['subject']+request.form['name']+'老师'
    else:
        name = '管理员'
    dict1 = {
        '用户名': name,
        '手机号': request.form['tel'],
        '密码': request.form['password'],
        '班级': dict(request.form)['class']
    }
    db.teacher.update_one({'手机号': session['手机号']}, {'$set': dict1})
    session['用户名'] = name
    session['手机号'] = request.form['tel']
    session['密码'] = request.form['password']
    session['班级'] = dict(request.form)['class']
    # 需要实现：发消息人改变
    return redirect('/home')


@app.route('/alter_admin', methods=['post'])
def alter_admin():
    if 'subject' in request.form:
        name = request.form['subject']+request.form['name']+'老师'
    else:
        name = '管理员'
    dict1 = {
        '用户名': name,
        '手机号': request.form['tel'],
        '密码': request.form['password'],
        '班级': dict(request.form)['class']
    }
    db.teacher.update_one({'手机号': request.form['old_tel']}, {'$set': dict1})
    if request.form['old_tel'] == session['手机号']:
        session['用户名'] = name
        session['手机号'] = request.form['tel']
        session['密码'] = request.form['password']
        session['班级'] = dict(request.form)['class']
    # 需要实现：发消息人改变
    return redirect('/user?tel='+request.form['old_tel'])


@app.route('/home')
def home():
    l = []
    for i in session['班级']:
        l1 = [i]
        data = db.data.find_one({'class': i})
        if data is None:
            data = {'class': i, 'message':[]}
            db.data.insert_one(data)
        if data['message'] == []:
            l1.append('')
            l1.append('')
            l1.append('')
            l1.append('')
            l1.append('')
        else:
            l1.append(data['message'][-1]['uuid'])
            l1.append(data['message'][-1]['time'])
            l1.append(data['message'][-1]['name'] + ': ')
            l1.append(long(data['message'][-1]['content'], 8-len(data['message'][-1]['name'])))
            l1.append(long(data_isread(data['message'][-1]['isread']), 10))
        l.append(l1)
    return render_template('home.html',
                           t_name=session['用户名'],
                           t_class=l,
                           t_range=range(len(l)),
                           t_user=user_list)


@app.route('/home1')
def home1():
    return render_template('home_1.html',
                           t_name=session['用户名'],
                           t_class=session['班级'],
                           t_range=range(len(session['班级'])))


@app.route('/class')
def class1():
    if request.args['class'] not in session['班级']:
        return redirect('/home')
    data = db.data.find_one({'class': request.args['class']})
    if data is None:
        data = {'class': request.args['class'], 'message':[]}
        db.data.insert_one(data)
    data = data['message']
    return render_template('class.html',
                           t_data=data,
                           t_name=session['用户名'],
                           t_class=request.args['class'],
                           t_user=user_list)


@app.route('/none')
def none():
    return render_template('none.html')

@socketio.on('connect')
def handle_connect():
    if request.remote_addr in user_ip:
        class1 = user_ip[request.remote_addr]
        if class1 not in user_list:
            user_list.append(class1)
        emit('online', {'class': class1}, broadcast=True)
    print('客户端已连接')

@socketio.on('disconnect')
def handle_disconnect():
    if request.remote_addr in user_ip:
        class1 = user_ip[request.remote_addr]
        if class1 in user_list:
            user_list.remove(class1)
        emit('outline', {'class': class1}, broadcast=True)
    print('客户端断开连接')

@socketio.on('init')
def init(data):
    class1 = data['class']
    byte_values = [class1[k] for k in class1]
    bytes_data = bytes(byte_values)
    class1 = bytes_data.decode()
    user_ip[request.remote_addr] = class1
    if class1 not in user_list:
        user_list.append(class1)
    emit('online', {'class': class1}, broadcast=True)

@socketio.on('send')
def send(data):
    isread = '未读'
    uuid1 = str(uuid.uuid1())
    class1 = data['class']
    content = data['content']
    time1 = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    if '通知' not in class1:
        data_send(content, class1, uuid1, time1, '')
    elif class1 != '全校通知':
        isread += ' : '
        l = classlist[class1[0:2]]
        data1 = db.data.find_one({'class': data['class']})
        data1['message'].append({
            'uuid': uuid1,
            'name': session['用户名'],
            'content': data['content'],
            'time': time1,
            'isread': [],
            'type': '',
            'state': []
        })
        for i in l:
            if not data_send(content, class1[0:2]+i, uuid1, time1, class1):
                data1['message'][-1]['state'].append(class1[0:2] + i)
            data1['message'][-1]['isread'].append(class1[0:2]+i)
            isread += class1[0:2]+i + ' '
        db.data.update_one({'class': class1}, {'$set': data1})
        data1['message'][-1]['class1'] = class1
        data1['message'][-1]['isread'] = data_isread(data1['message'][-1]['isread'])
        data1['message'][-1]['state'] = data_state(data1['message'][-1]['state'])
        emit('new', data1['message'][-1], broadcast=True)
    else:
        isread += ' : '
        data1 = db.data.find_one({'class': data['class']})
        data1['message'].append({
            'uuid': uuid1,
            'name': session['用户名'],
            'content': data['content'],
            'time': time1,
            'isread': [],
            'type': '',
            'state': []
        })
        for i in classlist:
            for j in classlist[i]:
                if not data_send(content, i+j, uuid1, time1, class1):
                    data1['message'][-1]['state'].append(i+j)
                data1['message'][-1]['isread'].append(i+j)
                isread += i+j + ' '
        db.data.update_one({'class': data['class']}, {'$set': data1})
        data1['message'][-1]['class1'] = class1
        data1['message'][-1]['isread'] = data_isread(data1['message'][-1]['isread'])
        data1['message'][-1]['state'] = data_state(data1['message'][-1]['state'])
        emit('new', data1['message'][-1], broadcast=True)

@socketio.on('resend')
def resend(data):
    class1 = data['class']
    uuid1 = data['uuid']
    time1 = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    data1 = db.data.find_one({'class': class1})
    for i in data1['message']:
        if i['uuid'] == uuid1:
            if i['state'] == False:
                data_delete(class1, uuid1)
                data_send(i['content'], class1, uuid1, time1, '')
            else:
                data1['message'].remove(i)
                data_delete(class1, uuid1)
                l = i['state']
                for j in l:
                    data2 = db.data.find_one({'class': j})
                    for k in data2['message']:
                        if k['uuid'] == uuid1:
                            data_delete(j, uuid1)
                            if data_send(k['content'], j, uuid1, time1, class1):
                                i['state'].remove(j)
                            break
                i['time'] = time1
                data1['message'].append(i)
                db.data.update_one({'class': data['class']}, {'$set': data1})
                i['class1'] = class1
                i['isread'] = data_isread(data1['message'][-1]['isread'])
                i['state'] = data_state(data1['message'][-1]['state'])
                emit('new', i, broadcast=True)
            break

@socketio.on('back_data')
def back(data):
    uuid1 = data['uuid']
    class1 = data['class']
    data_back(class1, uuid1)
    if '通知' in class1 and class1 != '全校通知':
        l = classlist[class1[0:2]]
        for i in l:
            data_back(class1[0:2]+i, uuid1)
    elif class1 == '全校通知':
        for i in classlist:
            for j in classlist[i]:
                data_back(i+j, uuid1)

@socketio.on('delete_data')
def delete(data):
    uuid1 = data['uuid']
    class1 = data['class']
    data_delete(class1, uuid1)
    if '通知' in class1 and class1 != '全校通知':
        l = classlist[class1[0:2]]
        for i in l:
            data_delete(class1[0:2]+i, uuid1)
    elif class1 == '全校通知':
        for i in classlist:
            for j in classlist[i]:
                data_delete(i+j, uuid1)

@socketio.on('isread')
def isread(data):
    class1 = data['class']
    byte_values = [class1[k] for k in class1]
    bytes_data = bytes(byte_values)
    class1 = bytes_data.decode()
    data1 = db.data.find_one({'class': class1})
    if data1 is None:
        return ''
    l = data1['message']
    for i in range(len(l)):
        if l[i]['uuid'] == data['uuid']:
            data1['message'][i]['isread'] = True
            db.data.update_one({'class': class1}, {'$set': data1})

            emit('update', {'uuid': data['uuid'], 'isread': '已读', 'class1': class1}, broadcast=True)
            if data1['message'][i]['type'] != '':
                data2 = db.data.find_one({'class': data1['message'][i]['type']})
                l1 = data2['message']
                for j in range(len(l1)):
                    if l1[j]['uuid'] == data['uuid']:
                        if class1 in data2['message'][j]['isread']:
                            data2['message'][j]['isread'].remove(class1)
                            db.data.update_one({'class': data1['message'][i]['type']}, {'$set': data2})
                            emit('update', {'uuid': data['uuid'], 'isread': data_isread(data2['message'][i]['isread']), 'class1': data1['message'][i]['type']}, broadcast=True)
                        break
            break

def data_send(content, class1, uuid1, time1, type1):
    data1 = db.data.find_one({'class': class1})
    data1['message'].append({
        'uuid': uuid1,
        'name': session['用户名'],
        'content': content,
        'time': time1,
        'isread': False,
        'type': type1,
        'state': class1 in user_list
    })
    db.data.update_one({'class': class1}, {'$set': data1})
    data1['message'][-1]['class1'] = class1
    data1['message'][-1]['isread'] = data_isread(data1['message'][-1]['isread'])
    data1['message'][-1]['state'] = data_state(data1['message'][-1]['state'])
    emit('new', data1['message'][-1], broadcast=True)
    return class1 in user_list

def data_back(class1, uuid1):
    data1 = db.data.find_one({'class': class1})
    l = data1['message']
    for i in range(len(l)):
        if l[i]['uuid'] == uuid1:
            data1['message'][i]['content'] = '此消息已撤回'
            break
    db.data.update_one({'class': class1}, {'$set': data1})
    emit('back', {'uuid': uuid1, 'class1': class1}, broadcast=True)

def data_delete(class1, uuid1):
    data1 = db.data.find_one({'class': class1})
    l = data1['message']
    for i in l:
        if i['uuid'] == uuid1:
            l.remove(i)
    db.data.update_one({'class': class1}, {'$set': data1})
    l1 = []
    data = db.data.find_one({'class': class1})
    if data['message'] == []:
        l1.append('')
        l1.append('')
        l1.append('')
        l1.append('')
        l1.append('')
    else:
        l1.append(data['message'][-1]['uuid'])
        l1.append(data['message'][-1]['time'])
        l1.append(data['message'][-1]['name'] + ': ')
        l1.append(long(data['message'][-1]['content'], 8-len(data['message'][-1]['name'])))
        l1.append(long(data_isread(data['message'][-1]['isread']), 10))
    emit('back', {'uuid': uuid1, 'class1': class1}, broadcast=True)
    emit('delete', {'uuid': uuid1, 'class1': class1, 'last': l1}, broadcast=True)

def data_isread(l):
    if l == [] or l == True:
        return '已读'
    elif l == False:
        return '未读'
    else:
        return '未读 : ' + ' '.join(l)

def data_state(l):
    if l == [] or l == True:
        return ''
    elif l == False:
        return '未发送成功'
    else:
        return '未发送成功 : ' + ' '.join(l)

def long(t, n):
    if len(t) > n:
        t = t[:n]+'...'
    return t

@app.errorhandler(404)
def error_date_404(error):
    return redirect('/home')

# @app.errorhandler(Exception)
# def error_date_500(error):
#     return redirect('/login')


if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5001, debug=True)
