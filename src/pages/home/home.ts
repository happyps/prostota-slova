import { EmailPage } from './../email/email';
import { Subscription } from 'rxjs/Subscription';
import { Component } from '@angular/core';
import { NavController, ActionSheetController, ViewController, App } from 'ionic-angular';
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
  localItems: any[];
  localItemsSubscription: Subscription;
  secondItems: FirebaseListObservable<any[]>;
  secondLocalItems;
  secondLocalItemsSubscription: Subscription;
  state: firebase.User;
  current: string;
  currentChainKey;
  secondChainKey;
  normalViewChainKey;
  chainsPath;
  currentChainKeyList: string[];
  searchChainKeyList: string[];
  static readonly SWIPE_LEFT = 2;

  constructor(
    public viewCtrl: ViewController,
    public appCtrl: App,
    public actionSheetCtrl: ActionSheetController,
    public navCtrl: NavController,
    public auth: AngularFireAuth,
    private db: AngularFireDatabase) {
    this.auth.authState.subscribe(state => {
      console.log('Auth state updated');
      console.log(state);
      if (state && state.emailVerified) {
        this.state = state;
      } else {
        this.state = null;
      }
      if (this.state) {
        db.object(`/users/${state.uid}`).update({ timestamp: new Date().toISOString() });
        this.chainsPath = `/users/${state.uid}/chains`;
        db.database.ref(this.chainsPath).orderByChild('selectTimestamp').limitToLast(20).once("value").then(res => {
          const chainsKeys = [];
          res.forEach(o => {
            console.log(o.key);
            chainsKeys.push(o.key);
          });
          console.log(chainsKeys);
          this.currentChainKeyList = chainsKeys;
          this.prevChain();
        });
      } else {
        this.items = null;
        if (this.localItemsSubscription) {
          this.localItemsSubscription.unsubscribe();
          this.localItemsSubscription = null;
        }
        if (this.secondLocalItemsSubscription) {
          this.secondLocalItemsSubscription.unsubscribe();
          this.secondLocalItemsSubscription = null;
        }
      }
    });
  }
  login() {
    console.log('login');
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Sing up',
      buttons: [
        {
          text: 'Google',
          handler: () => {
            console.log('Google');
            this.auth.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
          }
        },{
          text: 'Email',
          handler: () => {
            console.log('Email');
            //this.viewCtrl.dismiss();
            this.appCtrl.getRootNav().push(EmailPage);
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
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
    const key = this.items.push({ word: word, timestamp: new Date().toISOString() }).key;
    this.db.list(`/users/${this.state.uid}/words/${word}/${this.currentChainKey}`).push(key);
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
    this.currentChainKey = this.db.database.ref(this.chainsPath).push({ timestamp: new Date().toISOString() }).key;
    this.currentChainKeyList.push(this.currentChainKey);
    console.log(this.currentChainKey);
    this.updateChain();
  }
  updateChain() {
    console.log('updateChain');
    let path = `${this.chainsPath}/${this.currentChainKey}/words`;
    this.db.database.ref(`${this.chainsPath}/${this.currentChainKey}`).update({ 
      selectTimestamp: new Date().toISOString() });
    this.currentChainKeyList.splice(this.currentChainKeyList.indexOf(this.currentChainKey), 1);
    this.currentChainKeyList.push(this.currentChainKey);
    this.items = this.db.list(path);
    if (this.localItemsSubscription) {
      this.localItemsSubscription.unsubscribe();
    }
    this.localItemsSubscription = this.items.subscribe(v => {
      this.localItems = v.slice(0).reverse();
    });
  }
  selectChain() {
    this.currentChainKey = this.secondChainKey;
    this.prevChain();
    this.updateChain();
  }
  updateSecondChain() {
    console.log('updateSecondChain');
    const path = `${this.chainsPath}/${this.secondChainKey}/words`;
    this.secondItems = this.db.list(path);
    if (this.secondLocalItemsSubscription) {
      this.secondLocalItemsSubscription.unsubscribe();
    }
    this.secondLocalItemsSubscription = this.secondItems.subscribe(v => {
      this.secondLocalItems = v.slice(0).reverse();
    });
  }
  normalView() {
    this.secondChainKey = this.normalViewChainKey;
    this.normalViewChainKey = null;
    this.updateSecondChain();
  }
  search() {
    console.log('search');
    this.normalViewChainKey = this.secondChainKey;
    const chainMap = new Map<string, number>();
    const wordsCount = this.localItems.length;
    let checkedWords = 0;
    this.localItems.forEach(element => {
      console.log(element);
      const path = `/users/${this.state.uid}/words/${element.word}`;
      this.db.list(path).take(1).subscribe(a => {
        if (this.normalViewChainKey) {
          a.forEach(e => {
            const chainKey = e.$key;
            if (chainKey !== this.currentChainKey) {
              if (!chainMap.has(chainKey)) {
                chainMap.set(chainKey, 1);
              } else {
                chainMap.set(chainKey, chainMap.get(chainKey) + 1);
              }
            }
          });
          checkedWords++;
          if (checkedWords == wordsCount) {
            let items = Array.from(chainMap.keys()).map(key => {
              return { chainKey: key, chainCounter: chainMap.get(key) }
            });
            items.sort((first, second) => first.chainCounter - second.chainCounter);
            this.searchChainKeyList = items.map(item => item.chainKey);
            this.secondChainKey = null;
            this.prevChain();
          }
        }
      })
    });
  }
  switch2NextChain(a) {
    let nextKey = null;
    let stop = false;
    let lastKey = null;
    a.forEach(next => {
      console.log(next);
      lastKey = next;
      if (!nextKey && stop) {
        nextKey = lastKey;
      }
      if (this.secondChainKey && next == this.secondChainKey) {
        stop = true;
      }
    });
    this.secondChainKey = nextKey ? nextKey : lastKey;
    this.updateSecondChain();

  }
  nextChain() {
    console.log('nextChain');
    if (this.searchChainKeyList) {
      this.switch2NextChain(this.searchChainKeyList);
    } else {
      this.switch2NextChain(this.currentChainKeyList);
    }
  }
  switch2PrevChain(a) {
    let prevKey = null;
    let stop = false;
    a.forEach(next => {
      console.log(next);
      if (this.secondChainKey && next == this.secondChainKey) {
        stop = true;
      } else if (!stop) {
        prevKey = next;
      }
    });
    if (prevKey) {
      this.secondChainKey = prevKey;
      this.updateSecondChain();
    };
  }
  prevChain() {
    console.log('prevChain');
    if (this.searchChainKeyList) {
      this.switch2PrevChain(this.searchChainKeyList);
    } else {
      this.switch2PrevChain(this.currentChainKeyList);
    }

  }
  onKeyDown(event) {
    console.log('onKeyDown');
    console.log(event);
  }
  onKeyUp(event) {
    console.log('onKeyUp');
    console.log(event);
    if (!this.state) {
      return;
    }
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
      case 222:
      case 220: {
        if (event.altKey) {
          this.selectChain();
        }
        break;
      }
      case 81: { // q
        if (event.altKey) {
          this.search();
        }
        break;
      }
      case 90: { // z
        if (event.altKey) {
          this.normalView();
        }
        break;
      }
    }
    // UP 38
    // DOWN 40
    // \ 220
    // q 81
    // z 90
  }
  onKeyPress(event) {
    console.log(event);
    if (!this.state) {
      return;
    }
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

  swipeFirst(event, item) {
    if (!this.state) {
      return;
    }
    this.items.remove(item);
  }
  swipeSecond(event, item) {
    console.log('swipe');
    console.log(event);
    if (!this.state) {
      return;
    }
    if (event.direction ===  HomePage.SWIPE_LEFT) {
      this.addWord(item.word);
    }
  }
}
