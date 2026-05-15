<?php
use yii\helpers\Html;

/* @var $this yii\web\View */
/* @var $model common\models\Ticket */

?>
<div class="ticket-assigned">

    Ticket assigned for <?= Html::encode($model->restaurant->name) ?>

    <br />

    <?= nl2br(Html::encode($model->ticket_detail)) ?>

</div>

