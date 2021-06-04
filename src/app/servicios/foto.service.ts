//
//
import { Injectable } from '@angular/core';

import { Platform } from '@ionic/angular';

import { Capacitor } from '@capacitor/core';

/*
    camera The Camera API provides the ability to take a photo with the camera or choose an existing one from the photo album. */
import { Camera, CameraResultType, CameraSource, CameraPhoto } from '@capacitor/camera';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

import { Foto } from '../modelos/foto.interface';

//
//
@Injectable({   
                providedIn: 'root' })

//
//
export class FotoService {

    //
    public fotos: Foto[] = [];
    private FOTO_STORAGE: string = "fotos";
    private platform: Platform;
    
    constructor(platform: Platform) {
        this.platform = platform; }

    // Hace una foto
    public async addNewToGallery() {

        const capturedPhoto = await Camera.getPhoto({   resultType:   CameraResultType.Uri,
                                                        source:       CameraSource.Camera,
                                                        allowEditing: true,
                                                        quality:      100   });

        const saveImageFile = await this.savePicture(capturedPhoto);
        this.fotos.unshift(saveImageFile); 

        Storage.set({
            key:    this.FOTO_STORAGE,
            value:  JSON.stringify(this.fotos) });
    }

    //
    public async deletePicture(foto: Foto, posicion: number) {

        this.fotos.splice(posicion, 1);                                                     // borra la |foto| de [fotos]

        Storage.set({                                                                       // reescribe el almacen
            key:    this.FOTO_STORAGE,
            value:  JSON.stringify(this.fotos) });
                                                                                            // lo borra del storage
        const filename = foto.filepath.substr(foto.filepath.lastIndexOf('/') + 1);
        await Filesystem.deleteFile({   path:       filename,
                                        directory:  Directory.Data });
    }

    // carga las imagenes almacenadas previamente
    public async loadSaved() {

        const photoList = await Storage.get({ key: this.FOTO_STORAGE });        // recupera 
        this.fotos = JSON.parse(photoList.value) || [];

        if (!this.platform.is('hybrid')) { 
            for (let foto of this.fotos) {
                const readFile = await Filesystem.readFile({    path:       foto.filepath,
                                                                directory:  Directory.Data  });

                foto.webviewPath = `data:image/jpeg;base64,${readFile.data}`;   // Web platform only: Load the photo as base64 data
            }
        }
    }

    // almacena una fotografia
    private async savePicture(cameraPhoto: CameraPhoto) { 

        const base64Data = await this.readAsBase64(cameraPhoto);                    // fuerza la fotografia como base64, por obligación de API
        
        const fileName = new Date().getTime() + '.jpeg';
        const savedFile = await Filesystem.writeFile({  path:       fileName,
                                                        data:       base64Data,
                                                        directory:  Directory.Data });
        
        if (this.platform.is('hybrid')) {                                           // Muestre la nueva imagen reescribiendo 
            return {    filepath:       savedFile.uri,                              // 
                        webviewPath:    Capacitor.convertFileSrc(savedFile.uri), };                     
        } else {                                                                    // usa estos valores pq ya estan memorias
            return {    filepath:       fileName,                                   // y convertida
                        webviewPath:    cameraPhoto.webPath };
        }
    }
            
    //
    public getFotos(){
        return this.fotos; }
    
    //
    private async getPhotoFile(cameraPhoto: CameraPhoto, fileName: string): Promise<Foto> {
        return {    filepath:       fileName,
                    webviewPath:    cameraPhoto.webPath }
    }

    // se le pasa una fotografía, la toma como blob y la convierte a base64
    private async readAsBase64(cameraPhoto: CameraPhoto) {    
                                                                                    // es "hybrid" cuando detecta una de las
        if (this.platform.is("hybrid")) {                                           // dos plataformas (Cordova|Capacitor).
            const fichero = await Filesystem.readFile({ path: cameraPhoto.path });  // Ya hace la lectura en base64 
            
            return fichero.data;

        } else {                                                                     // convierte la fotografia a base64
            const response = await fetch(cameraPhoto.webPath!);
            const blob = await response.blob();

            return await this.convertBlobToBase64(blob) as string;}
    }

    // 
    convertBlobToBase64 = 
        (blob: Blob) =>         
            new Promise((resolve, reject) => {
            
                const reader = new FileReader;
                reader.onerror = reject;
                reader.onload = () => {
                    resolve(reader.result); };
                reader.readAsDataURL(blob);
            });
}