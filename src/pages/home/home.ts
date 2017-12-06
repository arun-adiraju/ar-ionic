import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { CameraPreview, CameraPreviewPictureOptions } from '@ionic-native/camera-preview';
import { Base64ToGallery } from '@ionic-native/base64-to-gallery';
import { LoadingController } from 'ionic-angular';
import { HTTP } from '@ionic-native/http';
import { errorHandler } from '@angular/platform-browser/src/browser';

import { ActionSheetController, ToastController, Platform, Loading } from 'ionic-angular';

import { File } from '@ionic-native/file';
import { Transfer, TransferObject } from '@ionic-native/transfer';
import { FilePath } from '@ionic-native/file-path';
import { Camera } from '@ionic-native/camera';

declare var cordova: any;
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  picture;
  info;
  imageLocation;

  type;
  costPrice; 
  weeklySales;
  seasonSales;
  monthlySales;

  lastImage: string = null;
  loading: Loading;

  constructor(public navCtrl: NavController, public cameraPreview: CameraPreview,
    public loadingCtrl: LoadingController,
    public http: HTTP,
    public base64ToGallery: Base64ToGallery,
    public platform: Platform,
    public toastCtrl: ToastController,
    private camera: Camera, private transfer: Transfer, private file: File, private filePath: FilePath
  ) {
    this.info = 'Capture Image';
  }

  capture() {
    // picture options
    const pictureOpts: CameraPreviewPictureOptions = {
      width: 1280,
      height: 1280,
      quality: 85
    }

    // take a picture
    this.cameraPreview.takePicture(pictureOpts).then((imageData) => {
      
      this.presentLoading();
      this.picture = 'data:image/jpeg;base64,' + imageData;
      this.info = 'Image Captured';
      console.log('Capture image success');
      
      var headers = {
        "Content-Type": "application/x-www-form-urlencoded"
      };

      var postData = {
        "image" : imageData 
      };
      this.http.post('http://35.193.71.148/mobile/upload', postData, headers)
      .then(data => {

        console.log(data.status);
        console.log(data.data); // data received by server
        console.log(data.headers);
        var uploadResponse = JSON.parse(data.data);
        this.info = "Uploaded file. Name : " + uploadResponse.file_name;
        this.imageLocation = this.picture; 
        var json = JSON.parse(data.data);
        var uploadedFileName = json.file_name;

        var similarUrl = 'http://35.193.71.148/mobile/similar?file_name=' + uploadedFileName;

        this.http.get(similarUrl, {}, {})
        .then(data => {
      
          var respsonseSimilar = JSON.parse(data.data);
          var similarUrl = respsonseSimilar.url[0];
          this.type = 'Category : ' + respsonseSimilar.type;
          this.costPrice = 'Cost price : ' + '100'; 
          this.weeklySales = 'Weekly sales : '+ '200';
          this.seasonSales = 'Season sales : ' + '300';
          this.monthlySales = 'Monthly sales: ' + '400';
          this.imageLocation = 'http://35.193.71.148/' + similarUrl;
        })
        .catch(error => {
          console.log(error.status);
          console.log(error.error); // error message as string
          console.log(error.headers);
          this.info = 'errror : ' + error + 'error status : ' + error.status + ' error message : ' + error.error;
        });
      })
      .catch(error => {
        console.log(error.status);
        console.log(error.error); // error message as string
        console.log(error.headers);
        this.info = 'errror : ' + error + 'error status : ' + error.status + ' error message : ' + error.error;
      });
    }, (err) => { 
      console.log('Capture image failed');
      console.log(err);
    });
  }

  saveImage(imageData) {
    this.base64ToGallery.base64ToGallery(imageData, { prefix: '_img' }).then(
      res => console.log('Saved image to gallery ', res),
      err => console.log('Error saving image to gallery ', err)
    );
  }

  presentLoading() {
    let loader = this.loadingCtrl.create({
      content: "Processing image...",
      duration: 2000
    });
    loader.present();
  }

  getRequest() {
    this.http.get('http://35.193.71.148/static/inputFiles/menShirt/n04197391_10607_0.jpg', {}, {})
    .then(data => {
  /*
      console.log(data.status);
      console.log(data.data); // data received by server
      console.log(data.headers);
      */
      this.imageLocation = "http://35.193.71.148/static/inputFiles/menShirt/n04197391_10607_0.jpg";
    })
    .catch(error => {
  
      console.log(error.status);
      console.log(error.error); // error message as string
      console.log(error.headers);
  
    });
  }

  public takePicture() {
    // Create options for the Camera Dialog
    var options = {
      quality: 100,
      //sourceType: sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };
   
    // Get the data of an image
    this.camera.getPicture(options).then((imagePath) => {
      // Special handling for Android library
     /*}if (this.platform.is('android') && sourceType === this.camera.PictureSourceType.PHOTOLIBRARY) {
        this.filePath.resolveNativePath(imagePath)
          .then(filePath => {
            let correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
            let currentName = imagePath.substring(imagePath.lastIndexOf('/') + 1, imagePath.lastIndexOf('?'));
            this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
          });
       else {
        var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
        var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
        this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
      }*/
      var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
      var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
      this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
      this.uploadImage();
    }, (err) => {
      this.presentToast('Error while selecting image.');
    });
  }

  // Create a new name for the image
private createFileName() {
  var d = new Date(),
  n = d.getTime(),
  newFileName =  n + ".jpg";
  return newFileName;
}
 
// Copy the image to a local folder
private copyFileToLocalDir(namePath, currentName, newFileName) {
  this.file.copyFile(namePath, currentName, cordova.file.dataDirectory, newFileName).then(success => {
    this.lastImage = newFileName;
  }, error => {
    this.presentToast('Error while storing file.');
  });
}
 
private presentToast(text) {
  let toast = this.toastCtrl.create({
    message: text,
    duration: 3000,
    position: 'bottom'
  });
  toast.present();
}
 
// Always get the accurate path to your apps folder
public pathForImage(img) {
  if (img === null) {
    return '';
  } else {
    return cordova.file.dataDirectory + img;
  }
}

  public uploadImage() {
    // Destination URL
    var url = 'http://35.193.71.148/mobile/upload';
   
    // File for Upload
    var targetPath = this.pathForImage(this.lastImage);
   
    // File name only
    var filename = this.lastImage;
   
    var options = {
      fileKey: "file",
      fileName: filename,
      chunkedMode: false,
      mimeType: "multipart/form-data",
      params : {'image': filename}
    };
   
    const fileTransfer: TransferObject = this.transfer.create();
   
    this.loading = this.loadingCtrl.create({
      content: 'Uploading...',
    });
    this.loading.present();
   
    // Use the FileTransfer to upload the image
    fileTransfer.upload(targetPath, url, options).then(data => {
      this.loading.dismissAll()
      this.presentToast('Image succesful uploaded.');
    }, err => {
      this.loading.dismissAll()
      this.presentToast('Error while uploading file.');
    });
  }

 public closeDiv(){

  this.info = '';
  this.imageLocation = '';
  this.type = '';
  this.costPrice = ''; 
  this.weeklySales = '';
  this.seasonSales = '';
  this.monthlySales = '';
  }

  public switchCamera(){
    this.cameraPreview.switchCamera();
  }
  
}
