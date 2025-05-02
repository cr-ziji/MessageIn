# coding=UTF-8
from flask import Flask, request, render_template, redirect, session
import pymongo
from pyttsx3 import init
import uuid, time, random

client = pymongo.MongoClient()
db = client.main

app = Flask(__name__)

app.secret_key = '123456'


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'  # 允许所有域名
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

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
        # have = db.teacher.find_one({'用户名': name})
        # if have is not None:
        #     return redirect('/register?alert=1')
        db.teacher.insert_one(dict1)
        session['用户名'] = name
        session['手机号'] = request.form['tel']
        session['密码'] = request.form['password']
        session['班级'] = dict(request.form)['class']
        return redirect('/home')


@app.route('/home')
def home():
    return render_template('home.html',
                           t_name=session['用户名'],
                           t_class=session['班级'],
                           t_range=range(len(session['班级'])))


@app.route('/class')
def class1():
    if request.args['class'] not in session['班级']:
        return redirect('/home')
    data = db.data.find_one({'class': request.args['class']})
    if data is None:
        data = {'class': request.args['class'], 'message':[], 'back':''}
        db.data.insert_one(data)
    data = data['message']
    return render_template('class.html',
                           t_data=data,
                           t_name=session['用户名'],
                           t_class=request.args['class'])

@app.route('/send')
def send():
    classlist = {
        '初一':['一班', '二班', '三班', '四班', '五班', '六班'],
		'初二':['一班', '二班', '三班', '四班'],
		'初三':['一班', '二班', '三班', '联培班'],
		'高一':['一班', '二班', '三班'],
		'高二':['一班', '二班', '三班', '四班'],
		'高三':['一班', '二班', '三班', '四班']
	}
    uuid1 = str(uuid.uuid1())
    class1 = request.args['class']
    if '通知' not in class1:
        data = db.data.find_one({'class': request.args['class']})
        data['message'].append({
            'uuid': uuid1,
            'name': session['用户名'],
            'content': request.args['content'],
            'time': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            'isread': False,
        })
        db.data.update_one({'class': request.args['class']}, {'$set': data})
    elif class1 != '全校通知':
        l = classlist[class1[0:2]]
        for i in l:
            data = db.data.find_one({'class': class1[0:2]+i})
            data['message'].append({
                'uuid': uuid1,
                'name': session['用户名'],
                'content': request.args['content'],
                'time': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                'isread': False,
            })
            db.data.update_one({'class': class1[0:2]+i}, {'$set': data})
    else:
        for i in classlist:
            for j in classlist[i]:
                data = db.data.find_one({'class': i+j})
                data['message'].append({
                    'uuid': uuid1,
                    'name': session['用户名'],
                    'content': request.args['content'],
                    'time': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                    'isread': False,
                })
                db.data.update_one({'class': i+j}, {'$set': data})
    return uuid1

@app.route('/back')
def back():
    data = db.data.find_one({'class': request.args['class']})
    l = data['message']
    for i in range(len(l)):
        if l[i]['uuid'] == request.args['uuid']:
            data['message'][i]['content'] = '此消息已撤回'
            break
    data['back'] = request.args['uuid']
    db.data.update_one({'class': request.args['class']}, {'$set': data})
    return ''

@app.route('/message')
def message():
    class1 = request.args['class']
    data = db.data.find_one({'class': class1})
    if data is None:
        return ''
    if data['message'][-1]['content'] != '此消息已撤回':
        content = data['message'][-1]['name'] + ':' + data['message'][-1]['content']
    else:
        content = '此消息已撤回'
    return '{"new":{"uuid":"' + data['message'][-1]['uuid'] + '","content":"' + content + '"},"back":{"uuid":"' + data['back'] + '"}}'

@app.route('/update')
def update():
    class1 = request.args['class']
    data = db.data.find_one({'class': class1})
    if data is None:
        return ''
    l = data['message']
    for i in range(len(l)):
        if l[i]['uuid'] == request.args['uuid']:
            data['message'][i]['isread'] = True
            break
    db.data.update_one({'class': request.args['class']}, {'$set': data})
    return ''

@app.errorhandler(404)
def error_date_404(error):
    return redirect('/login')

@app.errorhandler(Exception)
def error_date_500(error):
    return ''


if __name__ == '__main__':
    app.run(port=5001, debug=True)
