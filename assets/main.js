function deletePet (delButton) {
    const xhttp = new XMLHttpRequest();
    const idPet = delButton.parentElement.id;
    document.getElementById(idPet).remove();
    xhttp.open("POST", "/delete");
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({id: idPet}));
}