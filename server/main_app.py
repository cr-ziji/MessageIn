# coding=UTF-8
from flask import Flask, request, render_template, redirect, session
import pymongo
from pyttsx3 import init
import uuid, time, random

client = pymongo.MongoClient()
db = client.main

app = Flask(__name__)

app.secret_key = '123456'


@app.route('/')
def _():
    return redirect("/login")

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
        name = request.form['subject']+request.form['tel']+'老师'
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
    data = db.data.find_one({'class': request.args['class']})['message']
    return render_template('class.html',
                           t_data=data,
                           t_name=session['用户名'],
                           t_class=request.args['class'])

@app.route('/send')
def send():
    data = db.data.find_one({'class': request.args['class']})
    if data is None:
        data = {'class': request.args['class'], 'message':[]}
        db.data.insert_one(data)
    data['message'].append({
        'name': session['用户名'],
        'content': request.args['content'],
        'time': 'aaaa',
        'isread': False,
    })
    db.data.update_one({'class': request.args['class']}, {'$set': data})
    return ''

if __name__ == '__main__':
    app.run(port=5001, debug=True)
