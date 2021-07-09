import { Component } from "react";
class ExplainBindingsComponent extends Component{

  onClickMe=()=>{
    console.log(this);
  }
  render(){
    return(
      <button onClick={this.onClickMe
      }>
        Click me
      </button>
    )
  }
}

export default ExplainBindingsComponent