import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FirebaseListObservable, AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  items: FirebaseListObservable<any[]>;
  state: firebase.User;
  current: string;
  
  constructor(
    public navCtrl: NavController,
    public auth: AngularFireAuth,
    db: AngularFireDatabase) {
    this.auth.authState.subscribe(state => {
      console.log('Auth state updated');
      console.log(state);
      this.state = state;
      if (state) {
        this.items = db.list('/sample');
      } else {
        this.items = null;
      }
    });
  }
  login() {
    console.log('login');
    this.auth.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
  }
  logout() {
    console.log('logout');
    this.auth.auth.signOut();
    this.state = null;
  }
  addWord(word) {
    this.items.push(word);
  }
  removeWord(word) {
    console.log(`remove ${word}`);
    let item = null;
    this.items.forEach(a => a.forEach(v => {
      console.log(v);
      if (v.$value === word) {
        console.log(`found ${word}`);
        item = v;
      }
    }));
    if (item) {
      console.log(`remove ${item}`);
      this.items.remove(item);
    }
  }
  onKeyPress(event) {
    if (event.keyCode === 13 && this.current && this.current.length) {
      if (this.current.indexOf('-') === 0) {
        this.removeWord(this.current.substr(1));
      } else {
        this.addWord(this.current);
      }
      this.current = '';
    }
  }

}
