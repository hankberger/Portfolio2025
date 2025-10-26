import * as THREE from "three";
import Fish from "./Fish";

export default class School{

    public group: THREE.Group
    public realFish: Fish;


    constructor(scene: THREE.Scene){
        this.group = new THREE.Group();
        scene.add(this.group)
        
        if(this.realFish.instance){
            this.group.add(this.realFish.instance);
        }
    }
}