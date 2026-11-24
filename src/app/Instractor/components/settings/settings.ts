import { Component, inject, OnInit, signal } from '@angular/core';
import { UserInfo } from '../../../core/services/Services/instractor-info';
import { InstractorInfo, UserInfoModel } from '../../../Main/Models/user-info.model';

@Component({
  imports: [],
  selector: 'app-settings',
  styles: ``,
  templateUrl: './settings.html',
})
export class Settings implements OnInit{
  constructor(){}
  private readonly infoService=inject(UserInfo);
ngOnInit(): void {
  this.getInsInfo();
}
insInfo=signal<InstractorInfo>({} as InstractorInfo);
getInsInfo(){
this.infoService.getInstractorInfo().subscribe({
  next:(info:any)=>{this.insInfo.set(info)
    console.log(info);
    
  },error:(err)=>(console.log(err)
  )
})
}
}
