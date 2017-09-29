import { AngularFireAuth } from 'angularfire2/auth';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import * as firebase from 'firebase';


/**
 * Generated class for the EmailPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-email',
  templateUrl: 'email.html',
})
export class EmailPage {
  email: string;
  password: string;
  errorMessage: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public auth: AngularFireAuth,
    public alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EmailPage');
  }

  verify() {
    let user: any = firebase.auth().currentUser;
    user.sendEmailVerification().then(
      (success) => {
        let alert = this.alertCtrl.create({
          title: 'Sing Up Info',
          subTitle: 'Please verify your email',
          buttons: ['OK']
        });
        alert.present();
        this.navCtrl.pop();
      }
    ).catch(
      (error) => {
        console.log(error);
        let alert = this.alertCtrl.create({
          title: 'Sing Up Error',
          subTitle: error.message,
          buttons: ['OK']
        });
        alert.present();
      });
  }

  singUp() {
    this.auth.auth.createUserWithEmailAndPassword(this.email, this.password)
      .then(result => {
        console.log('success');
        console.log(result);
        this.verify();
      })
      .catch(error => {
        console.log(error);
        let alert = this.alertCtrl.create({
          title: 'Sing Up Error',
          subTitle: error.message,
          buttons: ['OK']
        });
        alert.present();

      });
  }

  login() {
    this.auth.auth.signInWithEmailAndPassword(this.email, this.password)
      .then(result => {
        if (result) {
          console.log('success');
          console.log(result);
          if (!result.emailVerified) {
            this.verify();
          } else {
            this.navCtrl.pop();
          }
        }
      })
      .catch(error => {
        console.log(error);
        let alert = this.alertCtrl.create({
          title: 'Sing In Error',
          subTitle: error.message,
          buttons: ['OK']
        });
        alert.present();
      });
  }

}
