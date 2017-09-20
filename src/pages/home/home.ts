import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FirebaseListObservable, AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import 'rxjs/add/operator/take';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  items: FirebaseListObservable<any[]>;
  secondItems: FirebaseListObservable<any[]>;
  state: firebase.User;
  current: string;
  chains: FirebaseListObservable<any[]>;
  //currentChain: firebase.database.ThenableReference;
  currentChainKey;
  secondChainKey;
  chainsPath;

  constructor(
    public navCtrl: NavController,
    public auth: AngularFireAuth,
    private db: AngularFireDatabase) {
    this.auth.authState.subscribe(state => {
      console.log('Auth state updated');
      console.log(state);
      this.state = state;
      if (state) {
        db.object(`/users/${state.uid}`).update({ exist: true });
        this.chainsPath = `/users/${state.uid}/chains`;
        this.chains = db.list(this.chainsPath);
        this.chains.take(1).subscribe(e => {
          this.prevChain()
        });
      } else {
        this.chains = null;
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
    if (!this.items) {
      this.createChain();
    }
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
  createChain() {
    console.log('createChain');
    this.currentChainKey = this.chains.push({ test: true }).key;
    console.log(this.currentChainKey);
    this.updateChain();
  }
  updateChain() {
    console.log('updateChain');
    this.items = this.db.list(`${this.chainsPath}/${this.currentChainKey}/words`);
  }
  selectChain() {
    this.currentChainKey = this.secondChainKey;
    this.updateChain();
  }
  updateSecondChain() {
    console.log('updateSecondChain');
    this.secondItems = this.db.list(`${this.chainsPath}/${this.secondChainKey}/words`);
  }
  nextChain() {
    console.log('nextChain');

    this.chains.take(1).subscribe(a => {
      let nextKey = null;
      let stop = false;
      let lastKey = null;
      a.forEach(next => {
        console.log(next);
        lastKey = next.$key;
        if (!nextKey && stop) {
          nextKey = lastKey;
        }
        if (this.secondChainKey && next.$key == this.secondChainKey) {
          stop = true;
        }
      });
      this.secondChainKey = nextKey ? nextKey : lastKey;
      this.updateSecondChain();

    });
  }
  prevChain() {
    console.log('prevChain');



    this.chains.take(1).subscribe(a => {
      let prevKey = null;
      let stop = false;
      a.forEach(next => {
        console.log(next);
        if (this.secondChainKey && next.$key == this.secondChainKey) {
          stop = true;
        } else if (!stop) {
          prevKey = next.$key;
        }
      });
      if (prevKey) {
        this.secondChainKey = prevKey;
        this.updateSecondChain();
      };
    });
  }
  onKeyDown(event) {
    console.log('onKeyDown');
    console.log(event);
  }
  onKeyUp(event) {
    console.log('onKeyUp');
    console.log(event);
    switch (event.keyCode) {
      case 40: {
        if (event.altKey) {
          this.prevChain();
        }
        break;
      }
      case 38: {
        if (event.altKey) {
          this.nextChain();
        }
        break;
      }
      case 220: {
        if (event.altKey) {
          this.selectChain();
        }
        break;
      }
    }
    // UP 38
    // DOWN 40
    // \ 220
  }
  onKeyPress(event) {
    console.log(event);
    if (event.keyCode === 13) {
      if (!this.current || !this.current.length) {
        this.createChain();
      } else if (this.current.indexOf('-') === 0) {
        this.removeWord(this.current.substr(1));
      } else {
        this.addWord(this.current);
      }
      this.current = '';
    }
  }

  dragItem;
  drag(event, item) {
    
    console.log(event);
    console.log(item);
    this.dragItem = item;
  }
  allowDrop(event) {
    console.log('allowDrop');
    event.preventDefault();
  }
  drop(event) {
    console.log('drop');
    this.addWord(this.dragItem.$value);
  }
}
