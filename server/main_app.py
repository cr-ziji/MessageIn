# coding=UTF-8
from flask import Flask, request, render_template, redirect, session
import pymongo
from pyttsx3 import init
import uuid, time, random

client = pymongo.MongoClient()
db = client.main

app = Flask(__name__)

app.secret_key = '123456'


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
            '用户名': request.form['nickname'],
            '密码': request.form['password']
        }
        have = db.teacher.find_one(dict1)
        if have is None:
            return redirect('/login?alert=1')
        session['用户名'] = have['用户名']
        session['密码'] = have['密码']
        return redirect('/home')
    elif request.form['type'] == '注册':
        dict1 = {
            '用户名': request.form['nickname'],
            '密码': request.form['password']
        }
        have = db.teacher.find_one({'用户名': request.form['nickname']})
        if have is not None:
            return redirect('/register?alert=1')
        db.teacher.insert_one(dict1)
        session['用户名'] = request.form['nickname']
        session['密码'] = request.form['password']
        return redirect('/home')


@app.route('/home')
def home():
    t = time.strftime("%Y-%m", time.localtime())
    return render_template('home.html',
                           t_nickname=session['昵称'])

if __name__ == '__main__':
    app.run(port=5001, debug=True)
