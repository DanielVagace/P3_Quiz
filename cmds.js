const {models} = require('./model');
const {log,biglog,errlog,colorize} = require("./out");
const Sequelize = require ('sequelize');

exports.helpCmd=rl=>{
    log("Commandos");
    log("list - Listar los quizzes existentes.");
    log("show <id> - Muestra la pregunta y la respuesta del quizz indicado.");
    log("add - Añadir un nuevo quizz");
    log("delete <id> - Borrar el quiz indicado ");
    log("edit <id> - Editar el quiz indicado");
    log("test <id> - Probar el quiz indicado");
    log("p|play - Jugar a preguntar aleatoriamente todos los quizzes");
    log("credits - Creditos");
    log("q|quit -Salir del programa");
    rl.prompt();
};
const makeQuestion = (rl,text)=>{
  return new Sequelize.Promise((resolve,reject)=>{
      rl.question(colorize(text,'red'),answer=>{
          resolve(answer.trim());
      });
  });
};


exports.addCmd=rl=>{
    makeQuestion(rl,'Introduzca una pregunta:')
        .then(q =>{
            return makeQuestion (rl,'Introduzca una respuesta:')
            .then (a => {
                return{question:q,answer:a};
            });
        })
        .then(quiz => {return models.quiz.create(quiz)})
        .then ((quiz) =>{log(`${colorize('Se ha añadido','magenta')}:${quiz.question},${colorize('=>','magenta')},${quiz.answer}`)})
        .catch(Sequelize.ValidationError, error=>{
            errlog('El quiz es erroneo');
            error.errors.forEach(({message})=>errlog(message));
        })
        .catch(error=>{errlog(error.message);})
        .then(()=>{rl.prompt();});
};


exports.listCmd=rl=> {
    models.quiz.findAll()
        .each(quiz => {
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

const validateId = Id => {
  return new Sequelize.Promise((resolve,reject)=>{
      if (typeof Id === "undefined"){
          reject(new Error (`Falta el parametro <id>.`));
      } else {
          id = parseInt(Id);
          if (Number.isNaN(id)){
              reject (new Error (`El valor del parametro <Id> no es un numero.`));}
              else{
                  resolve (id);
              }
          }
      });
};




exports.showCmd=(rl,id)=>{
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz =>{
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id = ${id}.`)
            }
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
        })
        .catch(error=>{
            errlog(error.message)
        })
        .then(()=> {rl.prompt()});
};


exports.deleteCmd=(rl,id)=>{
    validateId(id)
    .then(id => models.quiz.destroy({where:{id}}))
        .catch(error =>{errlog(error.message)} )
        .then(()=> {rl.prompt();});
};


exports.editCmd=(rl,id)=>{
validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz=> {
        if (!quiz) {
            throw new Error(`No hay quiz asociado a este Id: ${id}.`)
        }
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
        return makeQuestion(rl,'Introduzca una pregunta')
            .then (q=>{
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                return makeQuestion(rl,'Introduzca una respuesta')
                    .then (a=>{
                        quiz.question=q;
                        quiz.answer=a;
                        return quiz;
                    })
            })

    })
    .then(quiz=> {return quiz.save()})
    .then(quiz=>{log(`Se ha cambiado el quiz ${colorize(quiz.id,'magenta')} por: ${colorize(quiz.question)} ${colorize('=>','magenta')} ${colorize(quiz.answer)} `)})
    .catch(Sequelize.ValidationError, error =>{errlog('El quiz es erroneo:'); error.errors.forEach(({message})=> errlog(message));})
    .then (() => {rl.prompt();});

};


exports.testCmd=(rl,id)=>{
 validateId(id)
     .then(id => {return models.quiz.findById(id)})
     .then(quiz=>{
         return makeQuestion(rl,quiz.question)
             .then (a => {
                 if (a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                     log(`La respuesta es ${colorize('correcta', 'green')}`);
                     rl.prompt();
                 } else {log (`Has ${colorize('fallado','red')}`);rl.prompt();}
             })
     })
     .catch(Sequelize.ValidationError, error =>{errlog('El quiz es erroneo:'); error.errors.forEach(({message})=> errlog(message));})
     .catch(error=>{errlog(error.message)})
     .then(()=>{rl.prompt()})


    /**  if (typeof id === "undefined"){
        errlog('el id no existe');
        rl.prompt();
    } try{
        const quiz = model.getById(id);
        rl.question(quiz.question,resp=>{
            if (resp.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                log (`La respuesta es ${colorize('correcta','green')}`);
                rl.prompt();
            }
            else {log (`Has ${colorize('fallado','red')}`);rl.prompt();}
        });
    } catch (error){errlog(error.message);}
*/
   };


exports.playCmd=rl=>{
    let score = 0;
    let toBeResolved=[];
    models.quiz.findAll()
        .each(quiz=>{
            toBeResolved.push(quiz)
        })
        .then(()=>playOne())
    const playOne =()=>{
        if (toBeResolved.length === 0) {
            log(`No hay mas preguntas, tu puntuacion es de ${colorize(score, "green")}`);
        } else {
            const min = 0;
            const max = toBeResolved.length;
            let id_l = Math.floor(Math.random() * (max - min)) + min;
            let quiz = toBeResolved[id_l];
            return makeQuestion(rl, quiz.question)
                .then(a => {
                    if (a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                       log(" correct");
                       log(`La respuesta es ${colorize('correcta', 'green')}`);

                        score++;
                        toBeResolved.splice(id_l, 1);
                        playOne();

                    } else {
                        log("Incorrect")
                        log(`Has ${colorize('fallado', 'red')},tu puntuación es de ${colorize(score, "red")}`);
                        rl.prompt();
                    }
                })

                .catch(Sequelize.ValidationError, error => {
                    errlog('El quiz es erroneo:');
                    error.errors.forEach(({message}) => errlog(message));
                })
                .catch(error => {
                    errlog(error.message)
                })
                .then(() => {
                    rl.prompt()
                })
        }

    }


    /**const playOne =()=> {
        if (toBeResolved.length = 0) {
            log(`No hay mas preguntas, tu puntuacion es de ${colorize(score, "green")}`);
        } else {
            const min = 0;
            const max = toBeResolved.length;
            let id_l = Math.floor(Math.random() * (max - min)) + min;
            let id_g= toBeResolved[id_l];
            let quiz = model.getById(id);
            rl.question(quiz.question, resp => {
                if (resp.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                    log(`La respuesta es ${colorize('correcta', 'green')}`);
                    score++;
                    toBeResolved.splice(id,1);
                    playOne();
                }
                else {log (`Has ${colorize('fallado','red')} tu puntuació ha sido ${colorize(score,'blue')}`);
                rl.prompt();}
            })
        }

    }
    playOne();
     */
};


exports.creditsCmd=rl=>{log("Autor de la práctica");
    log("Daniel Vagace");
    rl.prompt();};