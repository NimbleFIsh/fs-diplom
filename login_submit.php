<?php
    $H = json_decode(file_get_contents('php://input'));

    if (!$H) die();

    if (file_exists('./authorization.json'))
    {
        $data = json_decode(file_get_contents('./authorization.json'), true);
        echo 'access '.(($data['mail'] === hash('sha256', $H->mail) && $data['pwd'] === hash('sha256', $H->pwd)) ? 'allowed!' : 'denied!');
    }
    else echo "file not exists!";