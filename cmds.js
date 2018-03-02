const model = require('./model');
const {log,biglog,errlog,colorize} = require("./out");


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

exports.addCmd=rl=>{
    rl.question(colorize('Introduzca una pregunta', 'red'),question =>{
        rl.question(colorize('Introduzca una respuesta', 'red'),answer =>{
            model.add(question,answer);
            log(`${colorize('Se ha añadido', 'magenta')}:${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt;
        } )
    })
};


exports.listCmd=rl=>{
    model.getAll().forEach(
        (quizzes,id) =>{
            log(`[${colorize(id,'magenta')}]:${quizzes.question}`);
        });
    rl.prompt();
};



exports.showCmd=(rl,id)=>{
    if (typeof id === "undefined"){
        errlog(`falta del parametro id`);
    } else {
        try{
            const quiz = model.getById(id);
            log(`[${colorize (id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
        } catch(error) {errlog(error.message);}
    }
    rl.prompt();
};


exports.deleteCmd=(rl,id)=>{

    if (typeof id === "undefined"){
    errlog(`falta del parametro id`);
    } else {
        try{ model.deleteByIndex(id);
        } catch(error) {errlog(error.message);}
    }
    rl.prompt();
};


exports.editCmd=(rl,id)=>{
    if (typeof id === "undefined"){
        errlog('Falta el parametro Id');
        rl.prompt
    } else{
        try{
            const quiz = model.getById(id);
            process.stdout.isTTY && setTimeout(() =>{rl.write(quiz.question)},0);
            rl.question(colorize('Introduzca una pregunta', 'red'),question =>{
                process.stdout.isTTY && setTimeout(() =>{rl.write(quiz.answer)},0);
                rl.question(colorize('Introduzca una respuesta', 'red'),answer =>{
                    model.update(id,question,answer);
                    log(`se ha cambiado el quiz ${colorize(id,'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                } )
            })
        }catch(error){errlog(error.message);rl.prompt(); }
    }
};


exports.testCmd=(rl,id)=>{
    if (typeof id === "undefined"){
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
};


exports.playCmd=rl=>{
    let score = 0;
    let toBeResolved=[];
    for (i=0;i<model.getAll().length;i++){
        toBeResolved[i]=i;
    }
    const playOne =()=> {
        if (toBeResolved.length = 0) {
            log(`No hay mas preguntas, tu puntuacion es de ${colorize(score, "green")}`);
        } else {
            const min = 0;
            const max = toBeResolved.length;
            let id = Math.floor(Math.random() * (max - min)) + min;
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
};


exports.creditsCmd=rl=>{log("Autor de la práctica");
    log("Daniel Vagace");
    rl.prompt();};