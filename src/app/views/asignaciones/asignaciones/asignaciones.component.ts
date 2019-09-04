import { Component, OnInit } from '@angular/core';
import {FormGroup, FormControl, Validators, ValidatorFn, AbstractControl} from '@angular/forms';

import {IAsignacion} from '../../../models/iasignacion.model';
import {ISeccion} from '../../../models/iseccion.model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ModalConfirmacionService} from '../../../services/modal-confirmacion.service';
import {CarrerasService} from '../../../../services/carreras.service';
import {AsigService} from '../../../services/asig.service';
import {DiasJornadaService} from '../../../services/dias-jornada.service';
import {JornadasService} from '../../../services/jornadas.service';
import {CatedraticosService} from '../../../services/catedraticos.service';
import {CursosService} from '../../../services/cursos.service';
import {IServerResponse} from '../../../models/iserverresponse.model';
import {PensumService} from '../../../services/pensum.service';
import {CursoPensumService} from '../../../services/curso-pensum.service';

@Component({
  selector: 'app-asignaciones',
  templateUrl: './asignaciones.component.html',
  styleUrls: ['./asignaciones.component.scss']
})
export class AsignacionesComponent implements OnInit {

  public filtro:ISeccion=null; // seccion a la que deberán pertenecer las asignaciones
  public asignaciones:IAsignacion[]=[];
  public asignacionSeleccionada = null;// asignacion seleccionada en la lista, con un click se selecciona y volviendo a hacer click se deselecciona


  public carreras:any[]=[];
  public pensums:any[]=[];
  public jornadas:any[]=[];
  public dias:any[]=[];
  public catedraticos:any[]=[];
  public cursos:any[]=[];

  private TimeRegex:RegExp = /^([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9])(:([0-5]?[0-9]))?)?$/g;

  private horarioInicio = undefined;
  private horarioFin = undefined;

  private errorMsg = null;

  // formulario para la seccion a filtrar
  public formFiltro = new FormGroup({
    za_carrera: new FormControl('',[
      Validators.required,
      Validators.pattern('[0-9]+')
    ]),
    ano_pensum: new FormControl('',[
      Validators.required,
      Validators.pattern('[0-9]+')
    ]),
    ano: new FormControl('',[
      Validators.required,
      Validators.pattern('[0-9]+')
    ]),
    no_semestre: new FormControl('1',[
      Validators.required,
      Validators.pattern('[0-9]+')
    ]),
    za_jornada: new FormControl('',[
      Validators.required,
      Validators.pattern('[0-9]+')
    ]),
    seccion: new FormControl('',[
      Validators.required,
      Validators.pattern('[A-Z]')
    ])
  });

  // private controlHoraInicio = new FormControl('',[
  //   Validators.required, //Validators.pattern('([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9]))?')
  //   Validators.pattern('([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9]))?'),
  //   horaInicioLtHoraFin(this.formAsignacion.get('hora_fin')),
  // ]);

  // private controlHoraFin = new FormControl('',[
  //   Validators.required, //Validators.pattern('([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9]))?')
  //   Validators.pattern('([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9]))?'),
  //   horaFinGtHoraInicio(this.formAsignacion.get('hora_inicio'))
  // ]);

  // formulario para editar o ingresar una nueva asignacion
  public formAsignacion = new FormGroup({
    za_curso: new FormControl('0',[
      Validators.required,
      Validators.pattern('[0-9]+')
    ]),
    za_profesor: new FormControl('0',[
      Validators.required,
      Validators.pattern('[0-9]+')
    ]),
    za_dia: new FormControl('0',[
      Validators.required,
      Validators.pattern('[0-9]+')
    ]),
    hora_inicio: new FormControl('',[
      Validators.required, //Validators.pattern('([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9]))?')
      Validators.pattern('([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9]))?'),
      this.horaInicioLtHoraFin(),
    ]),
    hora_fin: new FormControl('',[
      Validators.required, //Validators.pattern('([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9]))?')
      Validators.pattern('([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9]))?'),
      this.horaFinGtHoraInicio()
    ]),
  });

  constructor(
    private carrerasService: CarrerasService,
    private pensumService: PensumService,
    private jornadasService: JornadasService,
    private diasService:DiasJornadaService,
    private catedraticosService:CatedraticosService,
    private cursosService:CursosService,
    private cursoPensumService:CursoPensumService,
    private asigService: AsigService,
    private modalService: NgbModal, private modalConfirmacion:ModalConfirmacionService
  ) { }

  ngOnInit() {
    this.carrerasService.listCarreras().subscribe((datos:any)=>this.carreras=datos);
    // this.cursosService.listCursos().subscribe((datos:any)=>this.cursos=datos);
    this.catedraticosService.listCatedraticos().subscribe((datos:any)=>this.catedraticos=datos);
  }

  public guardarNueva(): void{

    let nuevaAsignacion: IAsignacion = {
      za_carrera: this.filtro.za_carrera,
      ano_pensum: this.filtro.ano_pensum,
      za_jornada: this.filtro.za_jornada,
      ano: this.filtro.ano,
      no_semestre: this.filtro.no_semestre,
      seccion: this.filtro.seccion,
      za_curso: this.formAsignacion.value.za_curso,
      za_profesor: this.formAsignacion.value.za_profesor,
      za_dia: this.formAsignacion.value.za_dia,
      hora_inicio: this.strToTime(this.formAsignacion.value.hora_inicio),
      hora_fin: this.strToTime(this.formAsignacion.value.hora_fin),
    };

    this.asigService.crearAsignacion(nuevaAsignacion).subscribe((res:IServerResponse)=>{
      if(res.status == 200){ // OK
        this.cargarAsignaciones();
        this.modalService.dismissAll();
      }else{// Error
        console.error(res);
        this.errorMsg = res.error;
      }

    });


  }

  public guardarEdicion():void{

    let actualizacion:IAsignacion = {
      za_carrera: this.asignacionSeleccionada.za_carrera,
      ano_pensum: this.asignacionSeleccionada.ano_pensum,
      za_jornada: this.asignacionSeleccionada.za_jornada,
      ano: this.asignacionSeleccionada.ano,
      no_semestre: this.asignacionSeleccionada.no_semestre,
      seccion: this.asignacionSeleccionada.seccion,
      za_curso: this.formAsignacion.value.za_curso,
      za_profesor: this.formAsignacion.value.za_profesor,
      za_dia: this.formAsignacion.value.za_dia,
      hora_inicio: this.strToTime(this.formAsignacion.value.hora_inicio),
      hora_fin: this.strToTime(this.formAsignacion.value.hora_fin),
    };

    this.asigService.actualizarAsignacion(this.asignacionSeleccionada,actualizacion)
      .subscribe((res:IServerResponse)=>{

        if(res.status == 200){ // actualizacion con exito
          this.cargarAsignaciones();
          this.modalService.dismissAll();
        }else { // hubo un error con la actualizacion
          console.error(res);
          this.errorMsg = res.error;
        }

      })

  }

  // muestra modal para pedir confirmacion de la asignacion seleccionada
  public eliminar():void {

    this.modalConfirmacion.mostrar(
      'Eliminar Asignacion',
      '¿Está seguro que quiere eliminar la asignacion?')
      .then(result => {

        if(result ==  true){
          this.asigService.eliminarAsignacion(this.asignacionSeleccionada)
            .subscribe((res:IServerResponse)=>{

            if(res.status == 200){ // OK
              this.cargarAsignaciones();
            }else{ // Error
              console.error(res);
            }

          });
        }

      })
      .catch(dismiss=>console.log(dismiss));

  }

  // metodo que se ejecuta cada vez que se selecciona o deselecciona una asignacion de la lista
  public onAsignacionClicked(asignacion:IAsignacion):void {
    if(asignacion == this.asignacionSeleccionada){
      this.asignacionSeleccionada = null;
    }else{
      this.asignacionSeleccionada = asignacion;
    }
  }

  // abre el modal par editar o ingresar nueva asignacion
  public openModal(content):void {

    this.errorMsg = null;
    this.formAsignacion.reset();

    if(this.asignacionSeleccionada != null){ // Edicion

      // se cargan los valores de la asignacion seleccionada en el formulario
      this.formAsignacion.setValue({
        za_curso: this.asignacionSeleccionada.za_curso,
        za_profesor: this.asignacionSeleccionada.za_profesor,
        za_dia: this.asignacionSeleccionada.za_dia,
        hora_inicio: this.asignacionSeleccionada.hora_inicio.substr(0,5),
        hora_fin: this.asignacionSeleccionada.hora_fin.substr(0,5)
      });

    }

    this.modalService.open(content, {
      centered: true,
      size: 'lg',
      windowClass: 'animated bounceIn'
    });

  }

  public onFiltrar():void {

    this.filtro = this.formFiltro.value;

    this.cargarCursos();// se cargan los cursos de la carrera,pensum y ciclo establecidos en el filtro

    // se cargan los dias de la carrera y jornada a filtrar
    this.cargarDias();

    this.cargarAsignaciones();

  }

  public cargarAsignaciones():void {

    this.asigService.listAsignaciones(this.filtro)
      .subscribe((res:IServerResponse)=>{

        this.asignacionSeleccionada = null;
        this.asignaciones = res.data

      });

  }

  public onCambioCarrera():void {
    this.cargarPensums();
    this.cargarJornadas();
  }

  public cargarPensums():void {
    this.pensumService.listPensums(this.formFiltro.value.za_carrera)
      .subscribe((res:any)=>this.pensums = res);
  }

  public cargarJornadas():void {

    this.jornadasService.listJornadas(this.formFiltro.value.za_carrera)
      .subscribe((res:any)=>this.jornadas = res);

  }

  public cargarDias():void {

    this.diasService.listDias(this.filtro.za_carrera,this.filtro.za_jornada)
      .subscribe((res:any)=>this.dias=res);

  }

  public cargarCursos():void {
    // let campoCarrera = this.formFiltro.get('za_carrera');
    // let campoAnoPensum = this.formFiltro.get('ano_pensum');
    // let campoCiclo = this.formFiltro.get('no_semestre');
      this.cursoPensumService.listCursos(this.formFiltro.value.za_carrera,this.formFiltro.value.ano_pensum,this.formFiltro.value.no_semestre)
        .subscribe((datos:IServerResponse)=>{
          if(datos.status == 200){
            this.cursos = datos.data;
          }else{
            this.cursos = [];
          }
        });
  }

  private strToTime(strTime):string {

    let regex = /^([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9])(:([0-5]?[0-9]))?)?$/g;
    let match=Array.from(strTime.matchAll(regex));

    let time = match[0][1];

    if(match[0][3]){
      time += ":" + match[0][3];
    }else{
      time += ":00";
    }

    if(match[0][5]){
      time += ":" + match[0][5];
    }else{
      time += ":00";
    }

    return time;
  }

  private horaInicioLtHoraFin(): ValidatorFn {
    return (controlIni: AbstractControl): {[key: string]: any} | null => {

      let horaInicio = controlIni.value;

      let error = {'horarioInvalido':{value: horaInicio}};

      if(horaInicio != null && horaInicio.length >= 1){
        let regex = /^([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9])(:([0-5]?[0-9]))?)?$/g;

        let matchIni=Array.from(horaInicio.matchAll(regex));

        if(matchIni.length > 0){
          let horaIni = matchIni[0][1]*1;
          let minutoIni = matchIni[0][3]*1;


          if(horaIni != undefined && !Number.isNaN(horaIni)){
            let inicio = horaIni * 60; // convertir a minutos
            if(minutoIni != undefined && !Number.isNaN(minutoIni)){
              inicio += minutoIni;
            }
            this.horarioInicio = inicio;

            //console.log("INI: " + this.horarioInicio+"-"+this.horarioFin);
            if(this.horarioFin == undefined || (this.horarioInicio < this.horarioFin)){
              //console.log("INI: Valido");
              let controlFin = this.formAsignacion.get('hora_fin');
              if(this.horarioFin != undefined && !controlFin.valid){
                controlFin.updateValueAndValidity();
              }
              //this.formAsignacion.get('hora_fin').updateValueAndValidity({onlySelf: true, emitEvent: false});
              return null;
            }else{
              //console.log("INI: Invalido");
              return error;
            }
          }
        }
      }
      this.horarioInicio = undefined;
      return error;

    };
  }

  private horaFinGtHoraInicio(): ValidatorFn {
    return (controlFin: AbstractControl): {[key: string]: any} | null => {

      let horaFin = controlFin.value;

      let error = {'horarioInvalido':{value: horaFin}};

      if(horaFin != null && horaFin.length >= 1){
        let regex = /^([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9])(:([0-5]?[0-9]))?)?$/g;

        let matchFin=Array.from(horaFin.matchAll(regex));

        if(matchFin.length > 0){
          let horaFinal = matchFin[0][1]*1;
          let minutoFinal = matchFin[0][3]*1;


          if(horaFinal != undefined && !Number.isNaN(horaFinal)){
            let fin = horaFinal * 60; // convertir a minutos
            if(minutoFinal != undefined && !Number.isNaN(minutoFinal)){
              fin += minutoFinal;
            }
            this.horarioFin = fin;
            //console.log("FIN:" + this.horarioInicio+"-"+this.horarioFin);

            if(this.horarioInicio == undefined || ( this.horarioInicio < this.horarioFin)) {
              //console.log("FIN: Valido");
              let controlIni = this.formAsignacion.get('hora_inicio');
              if(this.horarioInicio != undefined && !controlIni.valid){
                controlIni.updateValueAndValidity();
              }
              //this.formAsignacion.get('hora_inicio').updateValueAndValidity({onlySelf: true, emitEvent: false});
              return null;
            } else {
              //console.log("FIN: INVALIDO");
              return error;
            }
          }
        }
      }
      this.horarioFin = undefined;
      return error;

    };
  }


}
