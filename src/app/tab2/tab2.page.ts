//
//
import { Component } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';

import { FotoService } from '../servicios/foto.service';
import { Foto } from '../modelos/foto.interface';

//
//
@Component({
                selector:       'app-tab2',
                templateUrl:    'tab2.page.html',
                styleUrls:      ['tab2.page.scss']
})

//
//
export class Tab2Page {

    //
    public fotos: Foto[] = [];

    constructor(public fotoService: FotoService,
                public actionSheetController: ActionSheetController) {
        this.fotos = fotoService.getFotos(); }

    //
    async ngOnInit() {       
        await this.fotoService.loadSaved(); }

    //
    addFotoToGallery() {
        this.fotoService.addNewToGallery(); }

    //
    public async showActionSheet(foto: Foto, posicion: number) {

        const actionSheet = 
            await this.actionSheetController.create({

                header:     'Fotos',
                buttons:    [ { 
                                text: 'Delete',
                                role: 'destructive',
                                icon: 'trash',
                                handler: () => { this.fotoService.deletePicture(foto, posicion); }
                            },{
                                text: 'Cancel',
                                role: 'cancel',
                                icon: 'close',
                                handler: () => { /* Nothing to do, action sheet is automatically closed*/ }
                            }]
            });
        
        await actionSheet.present();
    }
}