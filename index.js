import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

// endereço e porta do servidor
const host = 'localhost';
const port = 3000;

// criando a aplicação usando express
const app = express();
// usando o cookie parser para ler cookies
app.use(cookieParser());

// a sessao devera ser parametrizada com uma chave secreta
app.use(session({
    secret: 'M1nh4Ch4v3S3cr3t4',
    resave: true, //a cada requisicao, a sessao sera salva, mesmo que nao tenha sido modificada
    saveUninitialized: true, //a sessao sera salva mesmo que nao tenha sido inicializada
    cookie: {
        secure: false, //false para desenvolvimento e true para producao (https)
        httpOnly: true, //false para desenvolvimento e true para producao
        maxAge: 1000 * 60 * 30 //tempo de vida do cookie em milissegundos (30 minutos)
    }
}));
// permite usar arquivos estáticos da pasta public (imagens, css, etc)
app.use(express.static('public'));

// permite ler dados enviados por formulário
app.use(express.urlencoded({ extended: false }));
// permite ler cookies

// vetor que vai armazenar os livros cadastrados
var Cadastro_livros = [];

// vetor que vai armazenar os leitores cadastrados
var Cadastro_leitor = [];
// função para gerar o menu de navegação
function menu(requisicao) {
        // variáveis para controlar a exibição dos links do menu
        const esconderCadastro = 
        requisicao.path === "/Cadastro_livro";
        const esconderHome = 
        requisicao.path === "/home";
        const esconderCadastroLeitor =
        requisicao.path === "/Cadastro_leitor";
        // lê o cookie do último acesso
        const ultimoAcesso = requisicao.cookies?.ultimoAcesso || "Nunca Acessou";
return `
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
<div class="container-fluid">

<div>
${esconderHome ? '' : '<a class="btn btn-outline-light m-1" href="/home">Home</a>'}
${esconderCadastro ? '' : '<a class="btn btn-outline-light m-1" href="/Cadastro_livro">Cadastro Livro</a>'}
${esconderCadastroLeitor ? '' : '<a class="btn btn-outline-light m-1" href="/Cadastro_leitor">Cadastro Leitor</a>'}
<a class="btn btn-outline-light m-1" href="/logout">Logout</a>
</div>

<div class="ms-auto text-light">
Último acesso: ${ultimoAcesso}</div>
</div>
</nav>
`;
}
// rota da página inicial
app.get('/',estaLogado, (requisicao,resposta)=>{
    resposta.redirect("/home");
});
app.get('/home', estaLogado, (requisicao, resposta) => {

    resposta.send(`
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <title>Home</title>
  
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>

    <body>

    ${menu(requisicao)}

    <div class="container-fluid mt-3">
       <h1>Bem-vindo a Biblioteca Virtual!</h1>
       <h4>Aqui você pode cadastrar livros e leitores, além de gerenciar os empréstimos de forma fácil e rápida.</h4>

    <img src="/home.png"
     class="img-fluid"
     style="max-width: 400px;">
    </div>
    </body>
    </html>
    `);
});
app.get('/Cadastro_leitor', estaLogado, (requisicao,resposta)=>{

    let lista = Cadastro_leitor.map(f => `
    <tr>
    <td>${f.nome}</td>
    <td>${f.cpf}</td>
    <td>${f.telefone}</td>
    <td>${f.emprestimo}</td>
    <td>${f.devolucao}</td>
    <td>${f.livro}</td>
    </tr>
    `).join("");

const livrosOptions = Cadastro_livros.map(l => `
<option value="${l.titulo}">${l.titulo}</option>
`).join("");
resposta.send(`
    <!-- página que mostra o formulário de Leitor -->
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Cadastro de Leitores</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
</head>

<body>

${menu(requisicao)}

<div class="container mt-4">

<h2>Cadastro de Leitores</h2>

<!-- formulário de cadastro -->
<form action="/Cadastro_leitor" method="POST">

Nome
<input class="form-control" name="nome">

CPF
<input class="form-control" name="cpf">

Telefone
<input class="form-control" name="telefone">

LIVRO PARA EMPRÉSTIMO
<select class="form-control" name="livro">
<option value="">Selecione um livro</option>
${livrosOptions}
</select>
DATA EMPRESTIMO
<input type="date" class="form-control" name="emprestimo">
DEVOLUÇÃO
<input type="date" class="form-control" name="devolucao">

<br>

<button class="btn btn-primary">Cadastrar</button>

</form>

<hr>

<h3>Leitores Cadastrados</h3>

<!-- tabela com leitores cadastrados -->
<table class="table table-bordered">

<tr>
<th>Nome</th>
<th>CPF</th>
<th>Telefone</th>
<th>Empréstimo</th>
<th>Devolução</th>
<th>Livro</th>
</tr>

${lista}

</table>

</div>

</body>
</html>
`);
});

app.post('/Cadastro_leitor', estaLogado, (requisicao,resposta)=>{
// pegando os dados enviados pelo formulário
const {nome,cpf,telefone,emprestimo,devolucao,livro} = requisicao.body;

// vetor para armazenar mensagens de erro
let erros = [];
// validação dos campos obrigatórios
if(!nome) erros.push("Nome não informado");
if(!cpf) erros.push("CPF não informado");
if(!telefone) erros.push("Telefone não informado");
if(!emprestimo) erros.push("Empréstimo não informado");
if(!devolucao) erros.push("Devolução não informada");
if(!livro) erros.push("Livro não selecionado");
if(erros.length>0){

resposta.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Erro</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
</head>

<body>

${menu(requisicao)}

<div class="container mt-5">

<div class="alert alert-danger">

<h3>Erro no Cadastro</h3>

${erros.join("<br>")}

<br><br>

<a href="/Cadastro_leitor" class="btn btn-primary">Voltar</a>

</div>

</div>

</body>
</html>
`);

}
else{

// se não tiver erro, adiciona leitor na lista
Cadastro_leitor.push({nome,cpf,telefone,emprestimo,devolucao,livro});

// redireciona de volta para a página de leitores
resposta.redirect("/Cadastro_leitor");

}

});


// página que mostra o formulário de cadastro de livro
app.get('/Cadastro_livro', estaLogado, (requisicao,resposta)=>{

// cria as linhas da tabela com os livros cadastrados
let lista = Cadastro_livros.map(l => `
<tr>
<td>${l.titulo}</td>
<td>${l.autor}</td>
<td>${l.ident_livro}</td>
<td>${l.editora}</td>
</tr>
`).join("");

resposta.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Cadastro de Livros</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
</head>

<body>

${menu(requisicao)}

<div class="container mt-4">

<h2>Cadastro de Livros</h2>

<!-- formulário de cadastro -->
<form action="/Cadastro_livro" method="POST">

Título
<input class="form-control" name="titulo">

Autor
<input class="form-control" name="autor">

Identificação do Livro ou ISBN
<input class="form-control" name="ident_livro">

Editora
<input class="form-control" name="editora">

<br>

<button class="btn btn-primary">Cadastrar Livro</button>

</form>

<hr>

<h3>Livros Cadastrados</h3>

<!-- tabela com livros cadastrados -->
<table class="table table-bordered">

<tr>
<th>Título</th>
<th>Autor</th>
<th> ISBN ou Identificação</th>
<th>Editora</th>
</tr>
${lista}

</table>

</div>

</body>
</html>
`);
});


// rota que recebe os dados do formulário de fornecedor
app.post('/Cadastro_livro',estaLogado,(requisicao,resposta)=>{


// pegando os dados enviados pelo formulário
const {titulo,autor,ident_livro,editora} = requisicao.body;

// vetor para armazenar mensagens de erro
let erros = [];

// validação dos campos obrigatórios
if(!titulo) erros.push("Título não informado");
if(!autor) erros.push("Autor não informado");
if(!ident_livro) erros.push("Identificação do livro não informada");
if(!editora) erros.push("Editora não informada");

// verificando se já existe algum dado repetido
if(Cadastro_livros.some(l => l.ident_livro === ident_livro)){
erros.push("Identificação do livro já cadastrada");
}
if(Cadastro_livros.some(l => l.titulo === titulo)){
erros.push("Título já cadastrado");
}
if(Cadastro_livros.some(l => l.autor === autor)){
erros.push("Autor já cadastrado");
}
if(Cadastro_livros.some(l => l.editora === editora)){
erros.push("Editora já cadastrada");
}
// se houver erros mostra mensagem na tela
if(erros.length>0){
resposta.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Erro</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
</head>

<body>

${menu(requisicao)}
<div class="container mt-5">
<div class="alert alert-danger">
<h3>Erro no Cadastro</h3>

${erros.join("<br>")}
<br><br>
<a href="/Cadastro_livro" class="btn btn-primary">Voltar</a>
</div>
</div>
</body>
</html>
`);

}
else{

// se não tiver erro, adiciona livro na lista
Cadastro_livros.push({titulo,autor,ident_livro,editora});

// redireciona de volta para a página de livros
resposta.redirect("/Cadastro_livro");

}

});


// página de login
app.get('/login', (requisicao,resposta)=>{
const ultimoAcesso = requisicao.cookies?.ultimoAcesso || "Nunca Acessou";

resposta.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Login</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
    <body>
        <div class="container mt-5">
            <h2>Login</h2>
        <!-- formulário de login -->
        <form method="POST" action="/login">
            Email
                <input class="form-control" name="email">
                        Senha
                    <input class="form-control" type="password" name="senha">
                        <br>
                    <button class="btn btn-success">
                        Entrar
                    </button>`);
    resposta.write(`
        
                <p class="mt-5 mb-3 text-body-secondary">Último acesso: ${ultimoAcesso}
            `);
        resposta.write(`
                </p>
                </form>
            </div>
    </body>
    </html>
`);
});


// rota que processa o login
app.post('/login',(requisicao,resposta)=>{
    const email = requisicao.body.email;
    const senha = requisicao.body.senha;
let erros = [];
if(!email) erros.push("Email não informado");
if(!senha) erros.push("Senha não informada");
// validacao estatica
if(email == "admin@empresa.com" && senha == "123456"){
     requisicao.session.logado = true; // marca a sessão como logada
     // armazena a data do último acesso em um cookie
    const DataUltimoAcesso = new Date();
    resposta.cookie("ultimoAcesso", DataUltimoAcesso.toLocaleString(), {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
}); 
    resposta.redirect("/home"); 
}
else{
    const ultimoAcesso = requisicao.cookies?.ultimoAcesso || "Nunca Acessou";
    resposta.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Login</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container mt-5">
<h2>Login</h2>
<!-- formulário de login -->
<form method="POST" action="/login">
Email
<input class="form-control" name="email">
Senha
<input class="form-control" type="password" name="senha">
<span class="text-danger">Email ou senha incorretos</span>
<br>
<button class="btn btn-success">Entrar</button>
<p class="mt-5 mb-3 text-body-secondary">
Último acesso: ${ultimoAcesso}
</p>
</form>
</div>
</body>
</html>
`);
}
});


// rota de logout
app.get('/logout',estaLogado,(requisicao,resposta)=>{

    requisicao.session.destroy();

    resposta.redirect("/login");
});

//Middleware para verificar se o usuário está logado
function estaLogado(requisicao,resposta,next){
    if(requisicao.session?.logado){
         next();
    }else{
        resposta.redirect("/login");
        }
}
// inicia o servidor
app.listen(port, () => {
console.log(`Servidor rodando em http://localhost:${port}`);
});
